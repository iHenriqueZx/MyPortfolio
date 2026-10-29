
package br.com.lizplugins.api.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PedidoRequest(
        @NotEmpty(message = "O pedido precisa ter pelo menos um produto.")
        @Size(max = 50, message = "O pedido pode conter no máximo 50 produtos.")
        List<@Valid ItemRequest> itens
) {
    public record ItemRequest(
            @NotNull(message = "Informe o ID do plugin.")
            @Positive(message = "O ID do plugin deve ser positivo.")
            Long pluginId,

            @NotNull(message = "Informe a quantidade.")
            @Positive(message = "A quantidade deve ser positiva.")
            Integer quantidade
    ) {
    }
}
