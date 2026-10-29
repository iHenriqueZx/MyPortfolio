package br.com.lizplugins.api.service;

import br.com.lizplugins.api.model.Plugin;
import br.com.lizplugins.api.repository.PluginRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PluginService {

    private final PluginRepository pluginRepository;

    public PluginService(PluginRepository pluginRepository) {
        this.pluginRepository = pluginRepository;
    }

    public List<Plugin> listarTodos() {
        return pluginRepository.findAll();
    }

    public Plugin buscarPorId(Long id) {
        return pluginRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Plugin não encontrado."
                ));
    }

    public List<Plugin> buscarPorCategoria(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return listarTodos();
        }

        return pluginRepository.findByCategoriaIgnoreCase(categoria.trim());
    }

    public List<Plugin> buscarPorNome(String nome) {
        if (nome == null || nome.isBlank()) {
            return listarTodos();
        }

        return pluginRepository.findByNomeContainingIgnoreCase(nome.trim());
    }

    public List<Plugin> listarPorGratuidade(boolean gratuito) {
        return pluginRepository.findByGratuito(gratuito);
    }

    public Plugin cadastrar(Plugin plugin) {
        validar(plugin);

        plugin.setId(null);

        if (plugin.isGratuito()) {
            plugin.setPreco(BigDecimal.ZERO);
        }

        return pluginRepository.save(plugin);
    }

    public Plugin atualizar(Long id, Plugin dados) {
        Plugin existente = buscarPorId(id);

        validar(dados);

        existente.setNome(dados.getNome().trim());
        existente.setVersao(dados.getVersao().trim());
        existente.setDescricao(dados.getDescricao().trim());
        existente.setTecnologias(dados.getTecnologias());
        existente.setGratuito(dados.isGratuito());
        existente.setPreco(
                dados.isGratuito() ? BigDecimal.ZERO : dados.getPreco()
        );
        existente.setCategoria(dados.getCategoria().trim());
        existente.setIcone(dados.getIcone());
        if (existente.getArquivoJar() == null || existente.getArquivoJar().isBlank()) {
            existente.setDownload(dados.getDownload());
        }
        existente.setVideoDemonstracao(dados.getVideoDemonstracao());

        return pluginRepository.save(existente);
    }

    public Plugin associarArquivo(Long id, String nomeArquivo) {
        Plugin plugin = buscarPorId(id);
        plugin.setArquivoJar(nomeArquivo);
        plugin.setDownload("/api/plugins/" + id + "/download");
        return pluginRepository.save(plugin);
    }

    public void excluir(Long id) {
        Plugin plugin = buscarPorId(id);
        pluginRepository.delete(plugin);
    }

    private void validar(Plugin plugin) {
        if (plugin == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os dados do plugin são obrigatórios."
            );
        }

        if (vazio(plugin.getNome())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O nome do plugin é obrigatório."
            );
        }

        if (plugin.getNome().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O nome pode ter no máximo 100 caracteres."
            );
        }

        if (vazio(plugin.getVersao())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A versão do plugin é obrigatória."
            );
        }

        if (vazio(plugin.getDescricao())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A descrição do plugin é obrigatória."
            );
        }

        if (vazio(plugin.getCategoria())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A categoria do plugin é obrigatória."
            );
        }

        if (!plugin.isGratuito()) {
            if (plugin.getPreco() == null
                    || plugin.getPreco().compareTo(BigDecimal.ZERO) <= 0) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Plugins pagos precisam ter um preço maior que zero."
                );
            }
        }
    }

    public Plugin registrarDownload(Long id) {
    Plugin plugin = buscarPorId(id);
    plugin.setDownloads(plugin.getDownloads() + 1);
    return pluginRepository.save(plugin);
    }

    private boolean vazio(String valor) {
        return valor == null || valor.isBlank();
    }
}