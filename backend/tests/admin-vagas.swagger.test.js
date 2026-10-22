import test from 'node:test';
import assert from 'node:assert/strict';
import { swaggerSpec } from '../src/config/swagger.js';

test('Swagger inclui gestão de vagas, sincronização e administração de usuários', () => {
  const esperadas = {
    '/admin/vagas': ['get', 'post'],
    '/admin/vagas/{id}': ['put', 'delete'],
    '/admin/vagas/{id}/ocultar': ['patch'],
    '/admin/vagas/{id}/reexibir': ['patch'],
    '/admin/vagas/sincronizar': ['post'],
    '/admin/usuarios': ['get'],
    '/admin/usuarios/{id}/desativar': ['patch'],
    '/admin/usuarios/{id}/reativar': ['patch'],
  };
  for (const [caminho, metodos] of Object.entries(esperadas))
    for (const metodo of metodos) {
      const operacao = swaggerSpec.paths[caminho]?.[metodo];
      assert.ok(operacao, `${metodo} ${caminho}`);
      assert.deepEqual(operacao.security, [{ bearerAuth: [] }]);
    }
});

test('referências locais de toda a especificação OpenAPI apontam para componentes existentes', () => {
  function visitar(valor) {
    if (!valor || typeof valor !== 'object') return;
    if (valor.$ref?.startsWith('#/')) {
      let destino = swaggerSpec;
      for (const parte of valor.$ref.slice(2).split('/'))
        destino = destino?.[parte.replace(/~1/g, '/').replace(/~0/g, '~')];
      assert.ok(destino, `Referência inválida: ${valor.$ref}`);
    }
    for (const filho of Object.values(valor)) visitar(filho);
  }
  visitar(swaggerSpec);
});
