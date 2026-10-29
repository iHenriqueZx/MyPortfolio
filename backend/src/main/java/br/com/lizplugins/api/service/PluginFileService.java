
package br.com.lizplugins.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipFile;

@Service
public class PluginFileService {

    private static final long TAMANHO_MAXIMO = 100L * 1024 * 1024;

    private final Path diretorioPlugins;

    public PluginFileService(
            @Value("${app.upload.plugins-dir:uploads/plugins}")
            String diretorioPlugins
    ) {
        this.diretorioPlugins = Path.of(diretorioPlugins)
                .toAbsolutePath()
                .normalize();
    }

    public String salvar(MultipartFile arquivo) throws IOException {
        validarExtensaoETamanho(arquivo);
        Files.createDirectories(diretorioPlugins);

        Path temporario = Files.createTempFile(
                diretorioPlugins, "validacao-", ".jar"
        );

        try {
            try (InputStream entrada = arquivo.getInputStream()) {
                Files.copy(
                        entrada,
                        temporario,
                        StandardCopyOption.REPLACE_EXISTING
                );
            }

            validarConteudo(temporario);

            String nomeArquivo = UUID.randomUUID() + ".jar";
            Path destino = diretorioPlugins.resolve(nomeArquivo).normalize();

            if (!destino.startsWith(diretorioPlugins)) {
                throw new IllegalArgumentException("Caminho inválido.");
            }

            Files.copy(temporario, destino);
            return nomeArquivo;
        } finally {
            Files.deleteIfExists(temporario);
        }
    }

    public Resource carregar(String nomeArquivo) throws IOException {
        if (nomeArquivo == null
                || !nomeArquivo.matches(
                        "[a-fA-F0-9-]{36}\\.jar"
                )) {
            throw new IllegalArgumentException("Nome de arquivo inválido.");
        }

        Path arquivo = diretorioPlugins.resolve(nomeArquivo).normalize();

        if (!arquivo.startsWith(diretorioPlugins)
                || !Files.isRegularFile(arquivo)) {
            throw new java.nio.file.NoSuchFileException(nomeArquivo);
        }

        Resource resource = new UrlResource(arquivo.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            throw new java.nio.file.NoSuchFileException(nomeArquivo);
        }

        return resource;
    }

    private void validarExtensaoETamanho(MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) {
            throw new IllegalArgumentException("Selecione um arquivo.");
        }

        if (arquivo.getSize() > TAMANHO_MAXIMO) {
            throw new IllegalArgumentException(
                    "O arquivo não pode ultrapassar 100 MB."
            );
        }

        String nome = arquivo.getOriginalFilename();

        if (nome == null
                || !nome.toLowerCase(Locale.ROOT).endsWith(".jar")) {
            throw new IllegalArgumentException(
                    "Somente arquivos .jar são permitidos."
            );
        }
    }

    private void validarConteudo(Path arquivo) throws IOException {
        boolean possuiDescritor = false;

        try (ZipFile zip = new ZipFile(arquivo.toFile())) {
            var entradas = zip.entries();

            while (entradas.hasMoreElements()) {
                ZipEntry entrada = entradas.nextElement();

                if (!entrada.isDirectory()
                        && (entrada.getName().equals("plugin.yml")
                        || entrada.getName().equals("paper-plugin.yml"))) {
                    possuiDescritor = true;
                    break;
                }
            }
        } catch (IOException e) {
            throw new IllegalArgumentException(
                    "O arquivo enviado não é um JAR válido."
            );
        }

        if (!possuiDescritor) {
            throw new IllegalArgumentException(
                    "O JAR precisa conter plugin.yml ou paper-plugin.yml."
            );
        }
    }
}
