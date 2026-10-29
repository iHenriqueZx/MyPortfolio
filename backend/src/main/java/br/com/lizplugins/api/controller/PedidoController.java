
package br.com.lizplugins.api.controller;

import br.com.lizplugins.api.dto.PedidoRequest;
import br.com.lizplugins.api.dto.PedidoResponse;
import br.com.lizplugins.api.service.PedidoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {

    private final PedidoService pedidoService;

    public PedidoController(PedidoService pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public PedidoResponse criar(
            @AuthenticationPrincipal String nomeUsuario,
            @Valid @RequestBody PedidoRequest request
    ) {
        return pedidoService.criar(nomeUsuario, request);
    }

    @GetMapping
    public List<PedidoResponse> listar(
            @AuthenticationPrincipal String nomeUsuario
    ) {
        return pedidoService.listar(nomeUsuario);
    }

    @GetMapping("/{id}")
    public PedidoResponse buscarPorId(
            @PathVariable Long id,
            @AuthenticationPrincipal String nomeUsuario
    ) {
        return pedidoService.buscarPorId(id, nomeUsuario);
    }
}
