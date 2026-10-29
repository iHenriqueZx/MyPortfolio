package br.com.lizplugins.api.service;

import br.com.lizplugins.api.dto.WikiPageRequest;
import br.com.lizplugins.api.model.Plugin;
import br.com.lizplugins.api.model.WikiPage;
import br.com.lizplugins.api.repository.PluginRepository;
import br.com.lizplugins.api.repository.WikiPageRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;

@Service
public class WikiPageService {

    private final WikiPageRepository wikiPageRepository;
    private final PluginRepository pluginRepository;

    public WikiPageService(
            WikiPageRepository wikiPageRepository,
            PluginRepository pluginRepository
    ) {
        this.wikiPageRepository = wikiPageRepository;
        this.pluginRepository = pluginRepository;
    }

    @Transactional(readOnly = true)
    public List<WikiPage> listarPublicados() {
        return wikiPageRepository.findByPublicadoTrueOrderByDataAtualizacaoDesc();
    }

    @Transactional(readOnly = true)
    public WikiPage buscarPublicado(String slug) {
        return wikiPageRepository.findBySlugAndPublicadoTrue(normalizarSlug(slug))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Página da Wiki não encontrada."
                ));
    }

    @Transactional(readOnly = true)
    public List<WikiPage> listarTodosAdmin() {
        return wikiPageRepository.findAllByOrderByDataAtualizacaoDesc();
    }

    @Transactional
    public WikiPage criar(WikiPageRequest request) {
        validar(request);

        WikiPage pagina = new WikiPage();
        preencher(pagina, request, null);

        return wikiPageRepository.save(pagina);
    }

    @Transactional
    public WikiPage atualizar(Long id, WikiPageRequest request) {
        validar(request);

        WikiPage pagina = wikiPageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Página da Wiki não encontrada."
                ));

        preencher(pagina, request, id);

        return wikiPageRepository.save(pagina);
    }

    @Transactional
    public void excluir(Long id) {
        WikiPage pagina = wikiPageRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Página da Wiki não encontrada."
                ));

        wikiPageRepository.delete(pagina);
    }

    private void preencher(
            WikiPage pagina,
            WikiPageRequest request,
            Long idAtual
    ) {
        String slug = normalizarSlug(request.slug());

        boolean existe = idAtual == null
                ? wikiPageRepository.existsBySlug(slug)
                : wikiPageRepository.existsBySlugAndIdNot(slug, idAtual);

        if (existe) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Já existe uma página com esse endereço."
            );
        }

        pagina.setTitulo(request.titulo().trim());
        pagina.setSlug(slug);
        pagina.setCategoria(request.categoria().trim());
        pagina.setConteudo(request.conteudo().trim());
        pagina.setPublicado(request.publicado());

        if (request.pluginId() == null) {
            pagina.setPlugin(null);
        } else {
            Plugin plugin = pluginRepository.findById(request.pluginId())
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND,
                            "Plugin vinculado não encontrado."
                    ));

            pagina.setPlugin(plugin);
        }
    }

    private void validar(WikiPageRequest request) {
        if (request == null) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Os dados da página são obrigatórios."
            );
        }

        if (request.titulo() == null || request.titulo().isBlank()
                || request.titulo().trim().length() > 150) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um título com até 150 caracteres."
            );
        }

        if (request.slug() == null || request.slug().isBlank()
                || request.slug().trim().length() > 180) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe um endereço com até 180 caracteres."
            );
        }

        if (request.categoria() == null || request.categoria().isBlank()
                || request.categoria().trim().length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe uma categoria com até 100 caracteres."
            );
        }

        if (request.conteudo() == null || request.conteudo().isBlank()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O conteúdo da página é obrigatório."
            );
        }

        String slug = normalizarSlug(request.slug());

        if (slug.isBlank() || slug.length() > 180) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O endereço da página é inválido."
            );
        }
    }

    private String normalizarSlug(String valor) {
        if (valor == null) {
            return "";
        }

        String normalizado = Normalizer.normalize(
                valor.trim().toLowerCase(Locale.ROOT),
                Normalizer.Form.NFD
        );

        normalizado = normalizado.replaceAll("\\p{M}", "");
        normalizado = normalizado.replaceAll("[^a-z0-9]+", "-");
        return normalizado.replaceAll("(^-+|-+$)", "");
    }
}