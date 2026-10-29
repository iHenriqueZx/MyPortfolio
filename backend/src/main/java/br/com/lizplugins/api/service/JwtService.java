
package br.com.lizplugins.api.service;

import br.com.lizplugins.api.model.Usuario;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    private final SecretKey secretKey;
    private final long validadeMs;

    public JwtService(
            @Value("${jwt.secret}") String segredo,
            @Value("${jwt.expiration-ms:3600000}") long validadeMs) {

        this.secretKey = Keys.hmacShaKeyFor(
                Decoders.BASE64.decode(segredo)
        );

        this.validadeMs = validadeMs;
    }

    public String gerarToken(Usuario usuario) {
        Date agora = new Date();
        Date expiracao = new Date(agora.getTime() + validadeMs);

        return Jwts.builder()
                .subject(usuario.getNomeUsuario())
                .claim("papel", usuario.getPapel().name())
                .issuedAt(agora)
                .expiration(expiracao)
                .signWith(secretKey)
                .compact();
    }

    public String extrairNomeUsuario(String token) {
        return extrairClaims(token).getSubject();
    }

    public String extrairPapel(String token) {
        return extrairClaims(token).get("papel", String.class);
    }

    public boolean tokenValido(String token) {
        try {
            Claims claims = extrairClaims(token);

            return claims.getSubject() != null
                    && claims.getExpiration() != null
                    && claims.getExpiration().after(new Date())
                    && claims.get("papel", String.class) != null;

        } catch (Exception e) {
            return false;
        }
    }

    private Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
