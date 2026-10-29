package br.com.lizplugins.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record WikiPageRequest(
        @NotBlank(message = "O título é obrigatório.")
        @Size(max = 150, message = "O título pode ter no máximo 150 caracteres.")
        String titulo,

        @NotBlank(message = "O endereço da página é obrigatório.")
        @Size(max = 180, message = "O endereço pode ter no máximo 180 caracteres.")
        String slug,

        @NotBlank(message = "A categoria é obrigatória.")
        @Size(max = 100, message = "A categoria pode ter no máximo 100 caracteres.")
        String categoria,

        @NotBlank(message = "O conteúdo é obrigatório.")
        String conteudo,

        boolean publicado,

        Long pluginId
) {
}
