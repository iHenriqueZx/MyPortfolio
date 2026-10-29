package br.com.lizplugins.api.service;

import br.com.lizplugins.api.model.Usuario;
import br.com.lizplugins.api.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional(readOnly = true)
    public LoginResultado login(String identificador, String senha) {
        if (identificador == null || senha == null
                || identificador.isBlank() || senha.isBlank()) {
            throw new IllegalArgumentException(
                    "Informe o usuário ou e-mail e a senha.");
        }

        String valor = identificador.trim();

        Usuario usuario;

        if (valor.contains("@")) {
            usuario = usuarioRepository
                    .findByEmailIgnoreCase(valor)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Usuário ou senha inválidos."));
        } else {
            usuario = usuarioRepository
                    .findByNomeUsuarioIgnoreCase(valor)
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Usuário ou senha inválidos."));
        }

        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            throw new IllegalArgumentException(
                    "Usuário ou senha inválidos.");
        }

        String token = jwtService.gerarToken(usuario);

        return new LoginResultado(usuario, token);
    }

    public record LoginResultado(Usuario usuario, String token) {
    }
}