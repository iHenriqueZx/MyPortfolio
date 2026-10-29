
package br.com.lizplugins.api.service;

import br.com.lizplugins.api.dto.PedidoRequest;
import br.com.lizplugins.api.dto.PedidoResponse;
import br.com.lizplugins.api.model.ItemPedido;
import br.com.lizplugins.api.model.Pedido;
import br.com.lizplugins.api.model.Plugin;
import br.com.lizplugins.api.model.Usuario;
import br.com.lizplugins.api.repository.PedidoRepository;
import br.com.lizplugins.api.repository.PluginRepository;
import br.com.lizplugins.api.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class PedidoService {

    private final PedidoRepository pedidoRepository;
    private final PluginRepository pluginRepository;
    private final UsuarioRepository usuarioRepository;

    public PedidoService(
            PedidoRepository pedidoRepository,
            PluginRepository pluginRepository,
            UsuarioRepository usuarioRepository
    ) {
        this.pedidoRepository = pedidoRepository;
        this.pluginRepository = pluginRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public PedidoResponse criar(String nomeUsuario, PedidoRequest request) {
        Usuario usuario = usuarioRepository
                .findByNomeUsuarioIgnoreCase(nomeUsuario)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuário autenticado não encontrado."
                ));

        Pedido pedido = new Pedido();
        pedido.setUsuario(usuario);

        BigDecimal total = BigDecimal.ZERO;
        Set<Long> pluginsAdicionados = new HashSet<>();

        for (PedidoRequest.ItemRequest itemRequest : request.itens()) {
            if (itemRequest.quantidade() > 99) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "A quantidade máxima por plugin é 99."
                );
            }

            if (!pluginsAdicionados.add(itemRequest.pluginId())) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Não repita o mesmo plugin no pedido."
                );
            }

            Plugin plugin = pluginRepository.findById(itemRequest.pluginId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Um dos plugins informados não foi encontrado."
                    ));

            BigDecimal preco = plugin.getPreco();

            if (plugin.isGratuito()
                    || preco == null
                    || preco.compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "O pedido pode conter apenas plugins pagos."
                );
            }

            ItemPedido item = new ItemPedido();
            item.setPlugin(plugin);
            item.setNomePlugin(plugin.getNome());
            item.setVersaoPlugin(plugin.getVersao());
            item.setPrecoUnitario(preco);
            item.setQuantidade(itemRequest.quantidade());

            BigDecimal subtotal = preco.multiply(
                    BigDecimal.valueOf(itemRequest.quantidade())
            );

            item.setSubtotal(subtotal);
            pedido.adicionarItem(item);

            total = total.add(subtotal);
        }

        pedido.setValorTotal(total);

        Pedido salvo = pedidoRepository.save(pedido);

        return PedidoResponse.de(salvo);
    }

    @Transactional(readOnly = true)
    public List<PedidoResponse> listar(String nomeUsuario) {
        Usuario usuario = buscarUsuario(nomeUsuario);

        return pedidoRepository
                .findByUsuarioIdOrderByDataCriacaoDesc(usuario.getId())
                .stream()
                .map(PedidoResponse::de)
                .toList();
    }

    @Transactional(readOnly = true)
    public PedidoResponse buscarPorId(Long pedidoId, String nomeUsuario) {
        Usuario usuario = buscarUsuario(nomeUsuario);

        Pedido pedido = pedidoRepository
                .buscarPedidoDoUsuario(pedidoId, usuario.getId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Pedido não encontrado."
                ));

        return PedidoResponse.de(pedido);
    }

    private Usuario buscarUsuario(String nomeUsuario) {
        return usuarioRepository
                .findByNomeUsuarioIgnoreCase(nomeUsuario)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Usuário autenticado não encontrado."
                ));
    }
}
