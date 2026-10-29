package br.com.lizplugins.api.repository;

import br.com.lizplugins.api.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByNomeUsuarioIgnoreCase(String nomeUsuario);

    Optional<Usuario> findByEmailIgnoreCase(String email);

    boolean existsByNomeUsuarioIgnoreCase(String nomeUsuario);

    boolean existsByEmailIgnoreCase(String email);
}