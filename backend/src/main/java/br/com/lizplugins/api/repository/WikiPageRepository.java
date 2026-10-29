
package br.com.lizplugins.api.repository;

import br.com.lizplugins.api.model.WikiPage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;

import java.util.List;
import java.util.Optional;

public interface WikiPageRepository extends JpaRepository<WikiPage, Long> {

    @EntityGraph(attributePaths = "plugin")
    List<WikiPage> findByPublicadoTrueOrderByDataAtualizacaoDesc();

    @EntityGraph(attributePaths = "plugin")
    Optional<WikiPage> findBySlugAndPublicadoTrue(String slug);

    @EntityGraph(attributePaths = "plugin")
    Optional<WikiPage> findById(Long id);

    @EntityGraph(attributePaths = "plugin")
    Optional<WikiPage> findBySlug(String slug);
    
    @EntityGraph(attributePaths = "plugin")
    List<WikiPage> findAllByOrderByDataAtualizacaoDesc();

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);
}