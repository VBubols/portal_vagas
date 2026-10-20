// Exportação do currículo em PDF compatível com ATS.
//
// O que torna um PDF "legível" para um ATS, e como isso é feito aqui:
//  - texto real e selecionável (PDFKit, sem imagem nem texto vetorizado);
//  - coluna única, sem tabelas, caixas de texto, ícones, cabeçalho ou rodapé;
//  - fonte padrão do PDF (Helvetica), sem fontes exóticas;
//  - títulos de seção convencionais, em português;
//  - ordem de leitura = ordem visual, de cima para baixo;
//  - datas em MM/AAAA e contatos/links escritos por extenso;
//  - seções vazias são omitidas.

import PDFDocument from 'pdfkit';
import {
  Curriculo, Skill, Experiencia, Formacao, Curso, Idioma, Link, Projeto,
} from '../models/index.js';
import { normalizarTexto } from '../utils/texto.js';

const FONTE = 'Helvetica';
const FONTE_NEGRITO = 'Helvetica-Bold';

const ROTULOS_GRAU = {
  tecnico: 'Técnico',
  tecnologo: 'Tecnólogo',
  graduacao: 'Graduação',
  pos_graduacao: 'Pós-graduação',
  mestrado: 'Mestrado',
  doutorado: 'Doutorado',
};
const ROTULOS_SITUACAO = { concluido: 'Concluído', cursando: 'Cursando', trancado: 'Trancado' };
const ROTULOS_IDIOMA = {
  basico: 'Básico',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
  fluente: 'Fluente',
  nativo: 'Nativo',
};
const ROTULOS_LINK = { github: 'GitHub', linkedin: 'LinkedIn', portfolio: 'Portfólio', outro: 'Link' };

// ---------------------------------------------------------------------------
// Helpers de texto
// ---------------------------------------------------------------------------

// A fonte padrão do PDF cobre Latin-1 (todo o português) mais alguns símbolos.
// Qualquer outro caractere (emoji, setas, etc.) sairia quebrado, então é removido.
const FORA_DO_CHARSET = /[^\t\n\r\x20-\x7E\xA0-\xFF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g;

export function limpar(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .normalize('NFC')
    .replace(/\r\n?/g, '\n')
    .replace(FORA_DO_CHARSET, '')
    .trim();
}

// Aceita 'YYYY-MM-DD' (DATEONLY) ou Date e devolve 'MM/AAAA'.
export function formatarMesAno(valor) {
  if (!valor) return '';
  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) return '';
    return `${String(valor.getUTCMonth() + 1).padStart(2, '0')}/${valor.getUTCFullYear()}`;
  }
  const m = /^(\d{4})-(\d{2})/.exec(String(valor));
  return m ? `${m[2]}/${m[1]}` : '';
}

const chaveData = (valor) => {
  if (!valor) return '';
  return valor instanceof Date ? valor.toISOString() : String(valor);
};

const juntar = (partes, separador = ' | ') => partes.filter(Boolean).join(separador);
const local = (cidade, uf) => juntar([limpar(cidade), limpar(uf)], ', ');

export function slugNomeArquivo(nome) {
  const slug = normalizarTexto(nome).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return `curriculo${slug ? `-${slug}` : ''}.pdf`;
}

// ---------------------------------------------------------------------------
// Montagem do conteúdo (ordenação e formatação), separada do desenho do PDF
// ---------------------------------------------------------------------------

function periodoExperiencia(exp) {
  const inicio = formatarMesAno(exp.inicio);
  const fim = exp.atual ? 'Atual' : formatarMesAno(exp.fim);
  return fim ? `${inicio} - ${fim}` : inicio;
}

function periodoFormacao(f) {
  const inicio = formatarMesAno(f.inicio);
  const fim = formatarMesAno(f.fim);
  // fim = conclusão ou previsão: em curso, deixa explícito que é previsão
  if (inicio && fim) return `${inicio} - ${fim}${f.situacao === 'cursando' ? ' (previsão)' : ''}`;
  if (fim) return `${f.situacao === 'cursando' ? 'Previsão de conclusão' : 'Conclusão'}: ${fim}`;
  if (inicio) return `Início: ${inicio}`;
  return '';
}

export function montarSecoes(cv) {
  const secoes = [];

  if (limpar(cv.resumo)) {
    secoes.push({ titulo: 'Resumo Profissional', tipo: 'texto', texto: limpar(cv.resumo) });
  }

  const skills = (cv.skills ?? []).map((s) => limpar(s.nome)).filter(Boolean)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  if (skills.length) {
    secoes.push({ titulo: 'Habilidades', tipo: 'texto', texto: skills.join(', ') });
  }

  const experiencias = [...(cv.experiencias ?? [])].sort(
    (a, b) => Number(b.atual) - Number(a.atual) || chaveData(b.inicio).localeCompare(chaveData(a.inicio)),
  );
  if (experiencias.length) {
    secoes.push({
      titulo: 'Experiência Profissional',
      tipo: 'itens',
      itens: experiencias.map((e) => ({
        titulo: juntar([limpar(e.cargo), limpar(e.empresa)]),
        detalhe: juntar([periodoExperiencia(e), local(e.cidade, e.uf)]),
        texto: limpar(e.descricao),
      })),
    });
  }

  const projetos = cv.projetos ?? [];
  if (projetos.length) {
    secoes.push({
      titulo: 'Projetos',
      tipo: 'itens',
      itens: projetos.map((p) => ({
        titulo: juntar([limpar(p.nome), limpar(p.url)]),
        detalhe: p.tecnologias?.length
          ? `Tecnologias: ${p.tecnologias.map(limpar).filter(Boolean).join(', ')}`
          : '',
        texto: limpar(p.descricao),
      })),
    });
  }

  const formacoes = [...(cv.formacoes ?? [])].sort(
    (a, b) => (chaveData(b.fim) || chaveData(b.inicio)).localeCompare(chaveData(a.fim) || chaveData(a.inicio)),
  );
  if (formacoes.length) {
    secoes.push({
      titulo: 'Formação Acadêmica',
      tipo: 'itens',
      itens: formacoes.map((f) => ({
        titulo: limpar(f.curso),
        detalhe: juntar([
          limpar(f.instituicao),
          ROTULOS_GRAU[f.grau] ?? limpar(f.grau),
          ROTULOS_SITUACAO[f.situacao] ?? limpar(f.situacao),
          periodoFormacao(f),
        ]),
      })),
    });
  }

  const cursos = [...(cv.cursos ?? [])].sort((a, b) => chaveData(b.conclusao).localeCompare(chaveData(a.conclusao)));
  if (cursos.length) {
    secoes.push({
      titulo: 'Cursos e Certificações',
      tipo: 'itens',
      itens: cursos.map((c) => ({
        titulo: limpar(c.nome),
        detalhe: juntar([
          limpar(c.instituicao),
          c.cargaHoraria ? `${c.cargaHoraria}h` : '',
          c.conclusao ? `Concluído em ${formatarMesAno(c.conclusao)}` : '',
        ]),
      })),
    });
  }

  const idiomas = cv.idiomas ?? [];
  if (idiomas.length) {
    secoes.push({
      titulo: 'Idiomas',
      tipo: 'linhas',
      linhas: idiomas.map((i) => `${limpar(i.idioma)}: ${ROTULOS_IDIOMA[i.nivel] ?? limpar(i.nivel)}`),
    });
  }

  return secoes;
}

function montarCabecalho(cv) {
  return {
    nome: limpar(cv.nomeCompleto),
    titulo: limpar(cv.titulo),
    contato: juntar([limpar(cv.emailContato), limpar(cv.telefone), local(cv.cidade, cv.uf)]),
    links: (cv.links ?? [])
      .map((l) => ({ rotulo: ROTULOS_LINK[l.tipo] ?? 'Link', url: limpar(l.url) }))
      .filter((l) => l.url),
  };
}

// ---------------------------------------------------------------------------
// Desenho do PDF
// ---------------------------------------------------------------------------

export function renderizarCurriculoPdf(cv) {
  const cabecalho = montarCabecalho(cv);
  const secoes = montarSecoes(cv);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 56, right: 56 },
      lang: 'pt-BR',
      displayTitle: true,
      info: {
        Title: `Currículo - ${cabecalho.nome}`,
        Author: cabecalho.nome,
        Subject: 'Currículo',
      },
    });

    const partes = [];
    doc.on('data', (parte) => partes.push(parte));
    doc.on('end', () => resolve(Buffer.concat(partes)));
    doc.on('error', reject);

    const larguraUtil = () => doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const espacoRestante = () => doc.page.height - doc.page.margins.bottom - doc.y;

    // Cabeçalho: nome, título profissional, contato e links, tudo em texto simples.
    doc.font(FONTE_NEGRITO).fontSize(20).fillColor('black').text(cabecalho.nome);
    if (cabecalho.titulo) doc.font(FONTE).fontSize(12).text(cabecalho.titulo);
    doc.moveDown(0.3);
    doc.font(FONTE).fontSize(10);
    if (cabecalho.contato) doc.text(cabecalho.contato);
    for (const l of cabecalho.links) {
      doc.text(`${l.rotulo}: `, { continued: true }).text(l.url, { link: l.url, underline: false });
    }

    const titulo = (texto) => {
      // evita título de seção solto no fim da página
      if (espacoRestante() < 80) doc.addPage();
      doc.moveDown(1);
      doc.font(FONTE_NEGRITO).fontSize(12).text(texto);
      const y = doc.y + 1;
      doc.moveTo(doc.page.margins.left, y).lineTo(doc.page.margins.left + larguraUtil(), y)
        .lineWidth(0.5).strokeColor('black').stroke();
      doc.moveDown(0.4);
    };

    for (const secao of secoes) {
      titulo(secao.titulo);

      if (secao.tipo === 'texto') {
        doc.font(FONTE).fontSize(10).text(secao.texto, { align: 'left' });
      }

      if (secao.tipo === 'linhas') {
        doc.font(FONTE).fontSize(10);
        for (const linha of secao.linhas) doc.text(linha);
      }

      if (secao.tipo === 'itens') {
        secao.itens.forEach((item, indice) => {
          if (indice > 0) doc.moveDown(0.6);
          if (espacoRestante() < 50) doc.addPage();
          doc.font(FONTE_NEGRITO).fontSize(10.5).text(item.titulo);
          if (item.detalhe) doc.font(FONTE).fontSize(10).text(item.detalhe);
          if (item.texto) {
            doc.moveDown(0.2);
            doc.font(FONTE).fontSize(10).text(item.texto, { align: 'left' });
          }
        });
      }
    }

    doc.end();
  });
}

// ---------------------------------------------------------------------------
// Carga do currículo e orquestração
// ---------------------------------------------------------------------------

export async function carregarCurriculoCompleto(usuarioId) {
  const curriculo = await Curriculo.findOne({
    where: { usuarioId },
    include: [
      { model: Skill, as: 'skills', attributes: ['id', 'nome'], through: { attributes: [] } },
      // `separate` evita o produto cartesiano entre as tabelas filhas
      { model: Experiencia, as: 'experiencias', separate: true },
      { model: Formacao, as: 'formacoes', separate: true },
      { model: Curso, as: 'cursos', separate: true },
      { model: Idioma, as: 'idiomas', separate: true },
      { model: Link, as: 'links', separate: true },
      { model: Projeto, as: 'projetos', separate: true },
    ],
  });
  return curriculo ? curriculo.get({ plain: true }) : null;
}

// Devolve { buffer, nomeArquivo } ou null se o usuário ainda não tem currículo.
export async function gerarPdfDoUsuario(usuarioId) {
  const cv = await carregarCurriculoCompleto(usuarioId);
  if (!cv) return null;
  return {
    buffer: await renderizarCurriculoPdf(cv),
    nomeArquivo: slugNomeArquivo(cv.nomeCompleto),
  };
}
