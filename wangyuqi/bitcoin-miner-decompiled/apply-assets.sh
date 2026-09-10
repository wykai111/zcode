#!/usr/bin/env bash
# apply-assets.sh — 把 friendly/ 里改过的素材同步回游戏真实目录
#
# 用法：
#   ./apply-assets.sh            同步所有比源文件新的素材
#   ./apply-assets.sh images/T_BitcoinLogo__71304163-*.png   只同步指定文件
#
# 原理：读取 friendly/manifest.json，按 UUID 把文件复制回
#       assets/assets/main/native/<XX>/<UUID>.<ext>
set -euo pipefail

cd "$(dirname "$0")"

FRIENDLY="friendly"
NATIVE="assets/assets/main/native"
MANIFEST="$FRIENDLY/manifest.json"

if [ ! -f "$MANIFEST" ]; then
  echo "✗ 找不到 $MANIFEST" >&2; exit 1
fi

# 用 node 解析 manifest，输出 "srcFriendly\tdstNative" 列表
PAIRS=()
while IFS= read -r line; do
  [ -n "$line" ] && PAIRS+=("$line")
done < <(node -e '
  const fs=require("fs"),path=require("path");
  const m=JSON.parse(fs.readFileSync(process.argv[1],"utf8"));
  const F="friendly";
  const lines=[];
  function emit(folder, entry, fullUuid){
    const ext = folder==="audio" ? (entry.ext||(entry.name.split(".").pop())) : "png";
    // 找 friendly 里的源文件（精确按文件名前缀，避免误匹配）
    const srcDir = path.join(F, folder);
    let src=null;
    if(fs.existsSync(srcDir)){
      for(const f of fs.readdirSync(srcDir)){
        if(f===entry.name+"__"+fullUuid+"."+ext || f.startsWith(entry.name+"__")){
          src=path.join(srcDir,f); break;
        }
      }
    }
    if(!src) return;
    // native 里该 UUID 的文件：只配对**扩展名相同**的，避免把 png 写进 astc/pkm/pvr。
    // 同时跳过 _a.png（alpha 分离版需单独处理，friendly 里没有）。
    const pre2 = fullUuid.slice(0,2);
    const dir = path.join("assets/assets/main/native", pre2);
    if(!fs.existsSync(dir)) return;
    for(const f of fs.readdirSync(dir)){
      if(f===fullUuid+"."+ext || f===fullUuid+".png.png"){
        lines.push(src+"\t"+path.join(dir,f));
      }
    }
  }
  for(const [uuid,e] of Object.entries(m.images||{})) emit("images", e, uuid);
  for(const [uuid,e] of Object.entries(m.audio||{}))  emit("audio",  e, uuid);
  for(const [uuid,e] of Object.entries(m.font||{}))   emit("font",   e, uuid);
  console.log(lines.join("\n"));
' "$MANIFEST")

count=0
for pair in "${PAIRS[@]}"; do
  [ -z "$pair" ] && continue
  src="${pair%%$'\t'*}"
  dst="${pair#*$'\t'}"
  # 只在指定参数时过滤
  if [ "$#" -gt 0 ]; then
    match=0
    for arg in "$@"; do
      case "$src" in *"$arg"*) match=1; break;; esac
    done
    [ "$match" -eq 0 ] && continue
  fi
  # 只复制比目标新的文件（避免无谓覆盖）
  if [ -f "$dst" ] && [ "$src" -ot "$dst" ] && [ "$#" -eq 0 ]; then
    continue
  fi
  cp "$src" "$dst"
  echo "✓ $(basename "$src")  →  ${dst#assets/assets/main/native/}"
  count=$((count+1))
done

echo ""
echo "完成：同步了 $count 个文件。"
echo "预览：  python3 -m http.server 8080   然后打开 http://localhost:8080/"
