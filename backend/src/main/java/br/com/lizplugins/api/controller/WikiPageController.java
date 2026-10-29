package br.com.lizplugins.api.controller;

import br.com.lizplugins.api.dto.WikiPageRequest;
import br.com.lizplugins.api.model.WikiPage;
import br.com.lizplugins.api.service.WikiPageService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class WikiPageController {

    private final WikiPageService wikiPageService;

    public WikiPageController(WikiPageService wikiPageService) {
        this.wikiPageService = wikiPageService;
    }

    @GetMapping("/api/wiki")
    public List<WikiPage> listarPublicados() {
        return wikiPageService.listarPublicados();
    }

    @GetMapping("/api/wiki/{slug}")
    public WikiPage buscarPublicado(@PathVariable String slug) {
        return wikiPageService.buscarPublicado(slug);
    }

    @GetMapping("/api/admin/wiki")
    public List<WikiPage> listarTodosAdmin() {
        return wikiPageService.listarTodosAdmin();
    }

    @PostMapping("/api/admin/wiki")
    @ResponseStatus(HttpStatus.CREATED)
    public WikiPage criar(@Valid @RequestBody WikiPageRequest request) {
        return wikiPageService.criar(request);
    }

    @PutMapping("/api/admin/wiki/{id}")
    public WikiPage atualizar(
            @PathVariable Long id,
            @Valid @RequestBody WikiPageRequest request
    ) {
        return wikiPageService.atualizar(id, request);
    }

    @DeleteMapping("/api/admin/wiki/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable Long id) {
        wikiPageService.excluir(id);
    }
}