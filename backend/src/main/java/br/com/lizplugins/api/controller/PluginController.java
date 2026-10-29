
package br.com.lizplugins.api.controller;

import br.com.lizplugins.api.model.Plugin;
import br.com.lizplugins.api.service.PluginFileService;
import br.com.lizplugins.api.service.PluginService;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class PluginController {

    private final PluginService pluginService;
    private final PluginFileService pluginFileService;

    public PluginController(
            PluginService pluginService,
            PluginFileService pluginFileService
    ) {
        this.pluginService = pluginService;
        this.pluginFileService = pluginFileService;
    }

    @GetMapping("/plugins")
    public List<Plugin> listar() {
        return pluginService.listarTodos();
    }

    @GetMapping("/plugins/{id}")
    public Plugin buscarPorId(@PathVariable Long id) {
        return pluginService.buscarPorId(id);
    }

    @PostMapping("/admin/plugins")
    public Plugin cadastrar(@RequestBody Plugin plugin) {
        return pluginService.cadastrar(plugin);
    }

    @PutMapping("/admin/plugins/{id}")
    public Plugin atualizar(
            @PathVariable Long id,
            @RequestBody Plugin plugin
    ) {
        return pluginService.atualizar(id, plugin);
    }

    @DeleteMapping("/admin/plugins/{id}")
    public ResponseEntity<Void> excluir(@PathVariable Long id) {
        pluginService.excluir(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping(
            value = "/admin/plugins/{id}/upload",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public Map<String, String> upload(
            @PathVariable Long id,
            @RequestParam("arquivo") MultipartFile arquivo
    ) throws IOException {
        Plugin plugin = pluginService.buscarPorId(id);

        String nomeArquivo = pluginFileService.salvar(arquivo);

        try {
            Plugin atualizado = pluginService.associarArquivo(
                    plugin.getId(),
                    nomeArquivo
            );

            return Map.of(
                    "nomeArquivo", nomeArquivo,
                    "download", atualizado.getDownload(),
                    "mensagem", "Plugin enviado e associado com sucesso."
            );
        } catch (RuntimeException e) {
            throw e;
        }
    }

    @GetMapping("/plugins/{id}/download")
    public ResponseEntity<Resource> baixar(@PathVariable Long id) throws IOException {
        Plugin plugin = pluginService.buscarPorId(id);

        String nomeArquivo = plugin.getArquivoJar();

        if (nomeArquivo == null || nomeArquivo.isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "Este plugin não possui um arquivo associado."
            );
        }

        Resource arquivo = pluginFileService.carregar(nomeArquivo);

        pluginService.registrarDownload(id);

        String nomeDownload = plugin.getNome()
                .trim()
                .replaceAll("[^a-zA-Z0-9._-]", "_");

        String versao = plugin.getVersao()
                .trim()
                .replaceAll("[^a-zA-Z0-9._-]", "_");

        String nomeFinal = nomeDownload + "-" + versao + ".jar";

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(nomeFinal)
                                .build()
                                .toString()
                )
                .body(arquivo);
    }

}
