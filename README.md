# Cline Memory Bank

このリポジトリは、clineチャットボットのメモリーバンク機能を提供します。会話間で永続的に情報を保存し、後で参照することができます。

## 使い方

### メモリの保存

```
!save <キー名> <値>
```

例:
```
!save 好きな食べ物 寿司
```

### メモリの取得

```
!get <キー名>
```

例:
```
!get 好きな食べ物
```

### すべてのメモリの表示

```
!list
```

### メモリの削除

```
!delete <キー名>
```

例:
```
!delete 好きな食べ物
```

## 高度な使い方

### タグ付きメモリ

```
!save <キー名> <値> #<タグ1> #<タグ2>
```

例:
```
!save 好きな食べ物 寿司 #食事 #好み
```

### タグでフィルタリング

```
!list #<タグ名>
```

例:
```
!list #食事
```

## 注意点

- キー名には半角英数字、日本語、アンダースコア、ハイフンが使用できます
- 値には任意のテキストを使用できます
- 同じキー名で保存すると上書きされます
