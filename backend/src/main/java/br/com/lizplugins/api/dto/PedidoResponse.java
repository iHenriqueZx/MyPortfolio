
package br.com.lizplugins.api.dto;

import br.com.lizplugins.api.model.Pedido;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record PedidoResponse(
        Long id,
        BigDecimal valorTotal,
        String status,
        LocalDateTime dataCriacao,
        List<ItemResponse> itens
) {
    public record ItemResponse(
            Long pluginId,
            String nomePlugin,
            String versaoPlugin,
            BigDecimal precoUnitario,
            int quantidade,
            BigDecimal subtotal
    ) {
    }

    public static PedidoResponse de(Pedido pedido) {
        List<ItemResponse> itens = pedido.getItens().stream()
                .map(item -> new ItemResponse(
                        item.getPlugin().getId(),
                        item.getNomePlugin(),
                        item.getVersaoPlugin(),
                        item.getPrecoUnitario(),
                        item.getQuantidade(),
                        item.getSubtotal()
                ))
                .toList();

        return new PedidoResponse(
                pedido.getId(),
                pedido.getValorTotal(),
                pedido.getStatus().name(),
                pedido.getDataCriacao(),
                itens
        );
    }
}
