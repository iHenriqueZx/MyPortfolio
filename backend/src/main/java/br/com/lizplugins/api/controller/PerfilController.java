
package br.com.lizplugins.api.controller;

import br.com.lizplugins.api.service.UsuarioService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;

@RestController
@RequestMapping("/api/perfil")
public class PerfilController {

    private final UsuarioService usuarioService;

    public PerfilController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping
    public Map<String, Object> consultar(Principal principal) {
        return usuarioService.consultarPerfil(principal.getName());
    }

    @PatchMapping("/email")
    public Map<String, String> alterarEmail(
            Principal principal,
            @RequestBody AlterarEmailRequest request) {

        usuarioService.alterarEmail(
                principal.getName(),
                request.email(),
                request.senhaAtual()
        );

        return Map.of("mensagem", "E-mail alterado com sucesso.");
    }

    @PatchMapping("/senha")
    public Map<String, String> alterarSenha(
            Principal principal,
            @RequestBody AlterarSenhaRequest request) {

        usuarioService.alterarSenha(
                principal.getName(),
                request.senhaAtual(),
                request.novaSenha()
        );

        return Map.of("mensagem", "Senha alterada com sucesso.");
    }


    @PatchMapping("/nome")
    public Map<String, Object> alterarNome(
            Principal principal,
            @RequestBody AlterarNomeRequest request) {

        return usuarioService.alterarNomeUsuario(
                principal.getName(),
                request.nomeUsuario()
        );
    }

    public record AlterarNomeRequest(String nomeUsuario) {}


    public record AlterarEmailRequest(
            String email,
            String senhaAtual
    ) {}

    public record AlterarSenhaRequest(
            String senhaAtual,
            String novaSenha
    ) {}
}
