/**
 * Cline Memory Bank Handler
 * 
 * clineのメモリーバンク機能のためのハンドラースクリプト
 * GitHub APIを使用してメモリーバンクを操作します
 */

// メモリユーティリティをインポート
const utils = require('./memory-utils');

/**
 * GitHub APIを使用してメモリーバンクを取得する
 * @param {string} owner - リポジトリのオーナー
 * @param {string} repo - リポジトリ名
 * @param {string} path - ファイルパス
 * @returns {Promise<Object>} - メモリーバンクオブジェクト
 */
async function fetchMemoryBank(owner, repo, path) {
  // GitHub APIエンドポイント
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data = await response.json();
    const content = atob(data.content); // Base64デコード
    const memoryBank = JSON.parse(content);
    
    return {
      memoryBank,
      sha: data.sha // ファイル更新時に必要
    };
  } catch (error) {
    console.error('Error fetching memory bank:', error);
    throw error;
  }
}

/**
 * GitHub APIを使用してメモリーバンクを更新する
 * @param {string} owner - リポジトリのオーナー
 * @param {string} repo - リポジトリ名
 * @param {string} path - ファイルパス
 * @param {Object} memoryBank - 更新するメモリーバンクオブジェクト
 * @param {string} sha - ファイルのSHA
 * @param {string} message - コミットメッセージ
 * @returns {Promise<Object>} - 更新結果
 */
async function updateMemoryBank(owner, repo, path, memoryBank, sha, message) {
  // GitHub APIエンドポイント
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  
  const content = JSON.stringify(memoryBank, null, 2);
  const encodedContent = btoa(content); // Base64エンコード
  
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'Authorization': `token ${process.env.GITHUB_TOKEN}`
      },
      body: JSON.stringify({
        message,
        content: encodedContent,
        sha
      })
    });
    
    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('Error updating memory bank:', error);
    throw error;
  }
}

/**
 * メモリーバンクコマンドを処理する
 * @param {string} input - ユーザー入力
 * @param {string} owner - リポジトリのオーナー（デフォルト: 'kimura00123'）
 * @param {string} repo - リポジトリ名（デフォルト: 'cline-memory-bank'）
 * @param {string} path - ファイルパス（デフォルト: 'memory-bank.json'）
 * @returns {Promise<string>} - 処理結果のメッセージ
 */
async function handleMemoryCommand(input, owner = 'kimura00123', repo = 'cline-memory-bank', path = 'memory-bank.json') {
  // コマンドの解析
  const parsedCommand = utils.parseCommand(input);
  
  // コマンドがなければ処理しない
  if (!parsedCommand.command) {
    return null;
  }
  
  try {
    // メモリーバンクの取得
    const { memoryBank, sha } = await fetchMemoryBank(owner, repo, path);
    
    // コマンドに応じた処理
    switch (parsedCommand.command) {
      case 'save': {
        const { key, value, tags } = parsedCommand;
        const updatedMemoryBank = utils.saveMemory(memoryBank, key, value, tags);
        
        // GitHubに更新を保存
        await updateMemoryBank(
          owner, 
          repo, 
          path, 
          updatedMemoryBank, 
          sha, 
          `メモリを保存: ${key}`
        );
        
        // タグの表示部分を作成
        const tagDisplay = tags && tags.length > 0 
          ? ` タグ: ${tags.map(t => `#${t}`).join(' ')}` 
          : '';
        
        return `「${key}」を「${value}」として保存しました。${tagDisplay}`;
      }
      
      case 'get': {
        const { key } = parsedCommand;
        const memory = utils.getMemory(memoryBank, key);
        
        if (!memory) {
          return `「${key}」は保存されていません。`;
        }
        
        // タグの表示部分を作成
        const tagDisplay = memory.tags && memory.tags.length > 0 
          ? ` (タグ: ${memory.tags.map(t => `#${t}`).join(' ')})` 
          : '';
        
        return `「${key}」は「${memory.value}」です。${tagDisplay}`;
      }
      
      case 'delete': {
        const { key } = parsedCommand;
        const memoryExists = memoryBank.memories && memoryBank.memories[key];
        
        if (!memoryExists) {
          return `「${key}」は保存されていません。`;
        }
        
        const updatedMemoryBank = utils.deleteMemory(memoryBank, key);
        
        // GitHubに更新を保存
        await updateMemoryBank(
          owner, 
          repo, 
          path, 
          updatedMemoryBank, 
          sha, 
          `メモリを削除: ${key}`
        );
        
        return `「${key}」を削除しました。`;
      }
      
      case 'list': {
        const { tagFilter } = parsedCommand;
        const memories = utils.listMemories(memoryBank, tagFilter);
        const keys = Object.keys(memories);
        
        if (keys.length === 0) {
          if (tagFilter) {
            return `タグ「#${tagFilter}」で保存されているメモリはありません。`;
          }
          return `保存されているメモリはありません。`;
        }
        
        // メモリの一覧を作成
        const header = tagFilter 
          ? `タグ「#${tagFilter}」で保存されているメモリ:` 
          : `保存されているメモリ:`;
        
        const memoryList = keys.map(key => {
          const memory = memories[key];
          const tagDisplay = memory.tags && memory.tags.length > 0 
            ? ` (タグ: ${memory.tags.map(t => `#${t}`).join(' ')})` 
            : '';
          
          return `- ${key}: ${memory.value}${tagDisplay}`;
        }).join('\n');
        
        return `${header}\n${memoryList}`;
      }
      
      default:
        return null;
    }
  } catch (error) {
    console.error('Memory command handler error:', error);
    return `メモリーバンク操作中にエラーが発生しました: ${error.message}`;
  }
}

// エクスポート（Node.js環境用）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleMemoryCommand,
    fetchMemoryBank,
    updateMemoryBank
  };
}
