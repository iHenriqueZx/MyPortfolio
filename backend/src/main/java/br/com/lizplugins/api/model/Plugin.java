package br.com.lizplugins.api.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "plugins")
public class Plugin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nome;

    @Column(nullable = false, length = 30)
    private String versao;

    @Column(nullable = false, length = 2000)
    private String descricao;

    @Column(length = 500)
    private String tecnologias;

    @Column(nullable = false)
    private boolean gratuito = true;

    @Column(precision = 10, scale = 2)
    private BigDecimal preco;

    @Column(nullable = false, length = 50)
    private String categoria;

    @Column(length = 500)
    private String icone;

    @Column(length = 1000)
    private String download;

    @Column(length = 1000)
    private String videoDemonstracao;

    @Column(nullable = false, updatable = false)
    private LocalDateTime dataCadastro;

    @Column(length = 100)
    private String arquivoJar;

    @Column(nullable = false)
    private long downloads = 0;

    @PrePersist
    protected void aoCriar() {
        if (dataCadastro == null) {
            dataCadastro = LocalDateTime.now();
        }

        if (gratuito) {
            preco = BigDecimal.ZERO;
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getVersao() {
        return versao;
    }

    public void setVersao(String versao) {
        this.versao = versao;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public String getTecnologias() {
        return tecnologias;
    }

    public void setTecnologias(String tecnologias) {
        this.tecnologias = tecnologias;
    }

    public boolean isGratuito() {
        return gratuito;
    }

    public void setGratuito(boolean gratuito) {
        this.gratuito = gratuito;
    }

    public BigDecimal getPreco() {
        return preco;
    }

    public void setPreco(BigDecimal preco) {
        this.preco = preco;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public String getDownload() {
        return download;
    }

    public void setDownload(String download) {
        this.download = download;
    }

    public String getVideoDemonstracao() {
        return videoDemonstracao;
    }

    public void setVideoDemonstracao(String videoDemonstracao) {
        this.videoDemonstracao = videoDemonstracao;
    }

    public LocalDateTime getDataCadastro() {
        return dataCadastro;
    }

    public void setDataCadastro(LocalDateTime dataCadastro) {
        this.dataCadastro = dataCadastro;
    }

    public String getArquivoJar() {
    return arquivoJar;
    }

    public void setArquivoJar(String arquivoJar) {
        this.arquivoJar = arquivoJar;
    }

    public long getDownloads() {
    return downloads;
    }

    public void setDownloads(long downloads) {
        this.downloads = downloads;
    }
}