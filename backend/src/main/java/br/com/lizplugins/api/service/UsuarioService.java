
package br.com.lizplugins.api.service;

import br.com.lizplugins.api.model.Usuario;
import br.com.lizplugins.api.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UsuarioService(
            UsuarioRepository usuarioRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public Usuario cadastrar(
            String nomeUsuario,
            String email,
            String senha) {

        nomeUsuario = nomeUsuario == null ? "" : nomeUsuario.trim();
        email = email == null ? "" : email.trim().toLowerCase();

        if (!nomeUsuario.matches("^[a-zA-Z0-9_]{3,30}$")) {
            throw new IllegalArgumentException(
                    "O nome deve ter de 3 a 30 caracteres, usando letras, números ou _.");
        }

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new IllegalArgumentException("Informe um e-mail válido.");
        }

        if (senha == null || senha.length() < 8 || senha.length() > 72) {
            throw new IllegalArgumentException(
                    "A senha deve ter entre 8 e 72 caracteres.");
        }

        if (usuarioRepository.existsByNomeUsuarioIgnoreCase(nomeUsuario)) {
            throw new IllegalArgumentException(
                    "Esse nome de usuário já está cadastrado.");
        }

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException(
                    "Esse e-mail já está cadastrado.");
        }

        Usuario usuario = new Usuario();
        usuario.setNomeUsuario(nomeUsuario);
        usuario.setEmail(email);
        usuario.setSenhaHash(passwordEncoder.encode(senha));

        return usuarioRepository.save(usuario);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> consultarPerfil(String nomeUsuario) {
        Usuario usuario = buscarUsuario(nomeUsuario);

        return Map.of(
                "id", usuario.getId(),
                "nomeUsuario", usuario.getNomeUsuario(),
                "email", usuario.getEmail(),
                "papel", usuario.getPapel().name(),
                "dataCadastro", usuario.getDataCadastro().toString()
        );
    }

    @Transactional
    public void alterarEmail(
            String nomeUsuario,
            String novoEmail,
            String senhaAtual) {

        Usuario usuario = buscarUsuario(nomeUsuario);
        validarSenhaAtual(usuario, senhaAtual);

        String email = novoEmail == null
                ? ""
                : novoEmail.trim().toLowerCase();

        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um e-mail válido.");
        }

        if (email.equalsIgnoreCase(usuario.getEmail())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O novo e-mail é igual ao atual.");
        }

        if (usuarioRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esse e-mail já está cadastrado.");
        }

        usuario.setEmail(email);
        usuarioRepository.save(usuario);
    }

    @Transactional
    public void alterarSenha(
            String nomeUsuario,
            String senhaAtual,
            String novaSenha) {

        Usuario usuario = buscarUsuario(nomeUsuario);
        validarSenhaAtual(usuario, senhaAtual);

        if (novaSenha == null
                || novaSenha.length() < 8
                || novaSenha.length() > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ter entre 8 e 72 caracteres.");
        }

        if (passwordEncoder.matches(novaSenha, usuario.getSenhaHash())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ser diferente da atual.");
        }

        usuario.setSenhaHash(passwordEncoder.encode(novaSenha));
        usuarioRepository.save(usuario);
    }

    @Transactional
    public Map<String, Object> alterarNomeUsuario(
            String nomeAtual,
            String novoNome) {

        Usuario usuario = buscarUsuario(nomeAtual);
        String nome = novoNome == null ? "" : novoNome.trim();

        if (!nome.matches("^[a-zA-Z0-9_]{3,30}$")) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O nome deve ter de 3 a 30 caracteres, usando apenas letras, números e _.");
        }

        if (nome.equalsIgnoreCase(usuario.getNomeUsuario())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um nome diferente do atual.");
        }

        if (usuarioRepository.existsByNomeUsuarioIgnoreCase(nome)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Esse nome de usuário já está em uso.");
        }

        usuario.setNomeUsuario(nome);
        usuarioRepository.save(usuario);

        return Map.of(
                "mensagem", "Nome de usuário alterado com sucesso.",
                "token", jwtService.gerarToken(usuario),
                "tipo", "Bearer",
                "usuario", Map.of(
                        "id", usuario.getId(),
                        "nomeUsuario", usuario.getNomeUsuario(),
                        "email", usuario.getEmail(),
                        "papel", usuario.getPapel().name()
                )
        );
    }

    private Usuario buscarUsuario(String nomeUsuario) {
        return usuarioRepository
                .findByNomeUsuarioIgnoreCase(nomeUsuario)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado."));
    }

    private void validarSenhaAtual(Usuario usuario, String senhaAtual) {
        if (senhaAtual == null
                || !passwordEncoder.matches(
                        senhaAtual,
                        usuario.getSenhaHash())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha atual está incorreta.");
        }
    }
}
