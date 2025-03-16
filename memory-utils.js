/**
 * Cline Memory Bank Utilities
 * 
 * メモリーバンクを操作するための関数群
 */

/**
 * メモリを保存する
 * @param {Object} memoryBank - メモリーバンクオブジェクト
 * @param {string} key - キー名
 * @param {string} value - 保存する値
 * @param {string[]} tags - タグの配列（オプション）
 * @returns {Object} - 更新されたメモリーバンク
 */
function saveMemory(memoryBank, key, value, tags = []) {
  // キーのバリデーション
  if (!key || typeof key !== 'string') {
    throw new Error('キー名は必須で、文字列である必要があります');
  }

  // memoryBankの初期化（必要な場合）
  if (!memoryBank.memories) {
    memoryBank.memories = {};
  }
  
  // 値の保存
  memoryBank.memories[key] = {
    value: value,
    tags: tags,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  // メタデータの更新
  memoryBank.metadata = memoryBank.metadata || {};
  memoryBank.metadata.last_updated = new Date().toISOString();
  
  return memoryBank;
}

/**
 * メモリを取得する
 * @param {Object} memoryBank - メモリーバンクオブジェクト
 * @param {string} key - キー名
 * @returns {Object|null} - メモリオブジェクトまたはnull
 */
function getMemory(memoryBank, key) {
  if (!memoryBank.memories || !memoryBank.memories[key]) {
    return null;
  }
  
  return memoryBank.memories[key];
}

/**
 * メモリを削除する
 * @param {Object} memoryBank - メモリーバンクオブジェクト
 * @param {string} key - キー名
 * @returns {Object} - 更新されたメモリーバンク
 */
function deleteMemory(memoryBank, key) {
  if (!memoryBank.memories) {
    return memoryBank;
  }
  
  if (memoryBank.memories[key]) {
    delete memoryBank.memories[key];
    
    // メタデータの更新
    memoryBank.metadata = memoryBank.metadata || {};
    memoryBank.metadata.last_updated = new Date().toISOString();
  }
  
  return memoryBank;
}

/**
 * すべてのメモリを取得する
 * @param {Object} memoryBank - メモリーバンクオブジェクト
 * @param {string} tagFilter - タグでフィルタリングする場合（オプション）
 * @returns {Object} - メモリの一覧
 */
function listMemories(memoryBank, tagFilter = null) {
  if (!memoryBank.memories) {
    return {};
  }
  
  if (!tagFilter) {
    return memoryBank.memories;
  }
  
  // タグでフィルタリング
  const filteredMemories = {};
  
  Object.keys(memoryBank.memories).forEach(key => {
    const memory = memoryBank.memories[key];
    if (memory.tags && memory.tags.includes(tagFilter)) {
      filteredMemories[key] = memory;
    }
  });
  
  return filteredMemories;
}

/**
 * コマンドを解析する
 * @param {string} input - ユーザー入力
 * @returns {Object} - 解析結果
 */
function parseCommand(input) {
  const saveRegex = /^!save\s+([^\s]+)\s+(.+?)(?:\s+#(.+))?$/;
  const getRegex = /^!get\s+([^\s]+)$/;
  const deleteRegex = /^!delete\s+([^\s]+)$/;
  const listRegex = /^!list(?:\s+#(.+))?$/;
  
  let match;
  
  if ((match = saveRegex.exec(input)) !== null) {
    const key = match[1];
    const value = match[2];
    const tagString = match[3] || '';
    const tags = tagString
      .split('#')
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
      
    return { command: 'save', key, value, tags };
  }
  
  if ((match = getRegex.exec(input)) !== null) {
    return { command: 'get', key: match[1] };
  }
  
  if ((match = deleteRegex.exec(input)) !== null) {
    return { command: 'delete', key: match[1] };
  }
  
  if ((match = listRegex.exec(input)) !== null) {
    return { command: 'list', tagFilter: match[1] || null };
  }
  
  return { command: null };
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    saveMemory,
    getMemory,
    deleteMemory,
    listMemories,
    parseCommand
  };
}
