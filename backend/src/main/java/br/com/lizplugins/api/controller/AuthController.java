package br.com.lizplugins.api.controller;

import br.com.lizplugins.api.model.Usuario;
import br.com.lizplugins.api.service.AuthService;
import br.com.lizplugins.api.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioService usuarioService;
    private final AuthService authService;

    public AuthController(
            UsuarioService usuarioService,
            AuthService authService) {
        this.usuarioService = usuarioService;
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> cadastrar(
            @RequestBody CadastroRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException(
                        "Informe os dados para cadastro.");
            }

            Usuario usuario = usuarioService.cadastrar(
                    request.nomeUsuario(),
                    request.email(),
                    request.senha()
            );

            return ResponseEntity.status(HttpStatus.CREATED).body(
                    Map.of(
                            "mensagem", "Conta criada com sucesso!",
                            "usuario", Map.of(
                                    "id", usuario.getId(),
                                    "nomeUsuario", usuario.getNomeUsuario(),
                                    "email", usuario.getEmail(),
                                    "dataCadastro", usuario.getDataCadastro().toString()
                            )
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    Map.of("erro", e.getMessage())
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody LoginRequest request) {
        try {
            if (request == null) {
                throw new IllegalArgumentException(
                        "Informe o usuário e a senha.");
            }

            AuthService.LoginResultado resultado = authService.login(
                    request.identificador(),
                    request.senha()
            );

            Usuario usuario = resultado.usuario();

            return ResponseEntity.ok(
                    Map.of(
                            "mensagem", "Login realizado com sucesso!",
                            "token", resultado.token(),
                            "tipo", "Bearer",
                            "usuario", Map.of(
                                    "id", usuario.getId(),
                                    "nomeUsuario", usuario.getNomeUsuario(),
                                    "email", usuario.getEmail(),
                                    "papel", usuario.getPapel().name()
                            )
                    )
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(
                    Map.of("erro", "Usuário ou senha inválidos.")
            );
        }
    }

    public record CadastroRequest(
            String nomeUsuario,
            String email,
            String senha
    ) {
    }

    public record LoginRequest(
            String identificador,
            String senha
    ) {
    }
}