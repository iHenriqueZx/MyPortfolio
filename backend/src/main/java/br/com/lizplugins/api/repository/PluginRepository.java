package br.com.lizplugins.api.repository;

import br.com.lizplugins.api.model.Plugin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PluginRepository extends JpaRepository<Plugin, Long> {

    List<Plugin> findByCategoriaIgnoreCase(String categoria);

    List<Plugin> findByNomeContainingIgnoreCase(String nome);

    List<Plugin> findByGratuito(boolean gratuito);
}