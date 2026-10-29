package br.com.lizplugins.api.security;

import br.com.lizplugins.api.repository.UsuarioRepository;
import br.com.lizplugins.api.service.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UsuarioRepository usuarioRepository;

    public JwtAuthenticationFilter(
            JwtService jwtService,
            UsuarioRepository usuarioRepository) {
        this.jwtService = jwtService;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        String authorization = request.getHeader("Authorization");

        if (authorization == null || !authorization.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authorization.substring(7);

        try {
            if (jwtService.tokenValido(token)
                    && SecurityContextHolder.getContext()
                    .getAuthentication() == null) {

                String nomeUsuario = jwtService.extrairNomeUsuario(token);

                usuarioRepository.findByNomeUsuarioIgnoreCase(nomeUsuario)
                        .ifPresent(usuario -> {

                            String papel = usuario.getPapel().name();

                            var autoridade = new SimpleGrantedAuthority(
                                    "ROLE_" + papel
                            );

                            var autenticacao =
                                    new UsernamePasswordAuthenticationToken(
                                            usuario.getNomeUsuario(),
                                            null,
                                            List.of(autoridade)
                                    );

                            autenticacao.setDetails(
                                    new WebAuthenticationDetailsSource()
                                            .buildDetails(request)
                            );

                            SecurityContextHolder.getContext()
                                    .setAuthentication(autenticacao);
                        });
            }
        } catch (JwtException | IllegalArgumentException e) {
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}