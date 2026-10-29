
package br.com.lizplugins.api.repository;

import br.com.lizplugins.api.model.Pedido;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    @EntityGraph(attributePaths = "itens")
    List<Pedido> findByUsuarioIdOrderByDataCriacaoDesc(Long usuarioId);

    @EntityGraph(attributePaths = "itens")
    @Query("""
            SELECT p
            FROM Pedido p
            WHERE p.id = :pedidoId
              AND p.usuario.id = :usuarioId
            """)
    Optional<Pedido> buscarPedidoDoUsuario(
            @Param("pedidoId") Long pedidoId,
            @Param("usuarioId") Long usuarioId
    );
}
