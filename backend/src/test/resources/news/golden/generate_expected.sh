#!/usr/bin/env bash
# grok_news_json.sh 의 후처리 jq 식을 그대로 옮겨, responses/ 의 고정 응답으로 기대값을 만든다.
# 외부 호출과 .env 읽기는 없다. Java 후처리가 스크립트와 같은 결과를 내는지 비교하는 기준이다.
#
# 다시 만들기: bash src/test/resources/news/golden/generate_expected.sh
#
# 스크립트와 다른 점 (chiikawa-v2 프롬프트 기준)
#  - 허용되지 않은 section 을 스크립트는 other_goods 로 바꾸지만 서버는 그 소식을 버린다. 고정 응답에는 없다.
#  - kind 는 프롬프트가 영어 코드를 직접 내므로 한국어·일본어 변환을 하지 않는다. 서버는 허용 값이 아니면 버린다.
#  - 상태 "시작됨"(시작일만 있고 이미 시작) 은 서버에서 "진행 중" 이다.
#  - 출처 계정(source_account)은 모델이 아니라 호출한 계정으로 정한다. link 가 없으면 빈 문자열로 맞춘다.
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"
TODAY="2026-11-09"
STORE_HOURS='10:30 ~ 22:00'
LABELS=(KR_shop KR_market JP_market JP_kouhou)   # 서버가 호출하는 순서와 같다
handle_of() {   # macOS 기본 bash(3.2)에는 연관 배열이 없어 case 로 둔다
  case "$1" in
    KR_shop) echo chiikawashop_kr ;;
    KR_market) echo chiikawa_m_kr ;;
    JP_market) echo chiikawa_market ;;
    JP_kouhou) echo chiikawa_kouhou ;;
  esac
}

JQ_NORM='def norm: if test("/status/[0-9]+") then "x:" + capture("/status/(?<id>[0-9]+)").id else ascii_downcase | sub("\\?.*$"; "") | sub("/$"; "") end;'

MERGED='[]'
for label in "${LABELS[@]}"; do
  res=$(cat "$DIR/responses/res_${label}.json")

  urls=$(echo "$res" | jq "$JQ_NORM"'
    ([.citations[]? | if type == "object" then .url else . end]
     + [.. | objects | .url? // empty])
    | map(select(type == "string") | norm) | unique')

  text=$(echo "$res" | jq -r '[.output[]? | select(.type=="message") | .content[]? | select(.type=="output_text") | .text] | join("")')
  cleaned=$(printf '%s' "$text" | jq -Rrs 'sub("^\\s*\u0060\u0060\u0060[a-zA-Z]*\\s*"; "") | sub("\\s*\u0060\u0060\u0060\\s*$"; "")')

  if echo "$cleaned" | jq -e '.items | type == "array"' >/dev/null 2>&1; then
    cleaned=$(echo "$cleaned" | jq --argjson urls "$urls" --arg handle "$(handle_of "$label")" "$JQ_NORM"'
      .items |= map(.source_account = $handle | .link_verified = (
        if ($urls | length) == 0 or (.link // "") == "" then null
        else ((.link | norm) as $l | ($urls | index($l)) != null) end))')
    MERGED=$(jq -n --argjson a "$MERGED" --argjson b "$(echo "$cleaned" | jq '.items')" '$a + $b')
  fi
done

MERGED=$(echo "$MERGED" | jq "$JQ_NORM"'
  reduce .[] as $i ([];
    if (($i.link // "") | test("^https?://")) and (map(.link // "" | norm) | index($i.link | norm)) != null then . else . + [$i] end)
  | map(. as $x | .section = (if (["korea_store","korea_online","japan_official","other_goods","overseas"] | index($x.section // "")) != null
                              then $x.section else "other_goods" end))')

MERGED=$(echo "$MERGED" | jq --arg hours "$STORE_HOURS" '
  ($hours | gsub("\\s"; "")) as $h
  | map(.notes = ((.notes // []) | map(select(
      ((gsub("\\s"; "") | contains($h)) and (test("변경|단축|연장|휴무|임시") | not)) | not))))')

MERGED=$(echo "$MERGED" | jq '
  map(.link = (.link // "")
      | .ref_url = (if (.ref_url | type) == "string" and .ref_url != ""
                    then (.ref_url | gsub("utm_[A-Za-z]+=[^&]*&?"; "") | sub("[?&]$"; "")) else null end))')

MERGED=$(echo "$MERGED" | jq --arg today "$TODAY" '
  def d: if type == "string" and test("^\\d{4}-\\d{2}-\\d{2}$") then . else null end;
  map(. as $x | ($x.start_date | d) as $s | ($x.end_date | d) as $e
    | .timing = (if $s != null and $s > $today then "예정"
                 elif $e != null and $e < $today then "종료"
                 elif $e != null then "진행 중"
                 elif $s != null then "진행 중"
                 elif (((.title // "") + " " + (.date_label // "")) | test("종료|마감|終了")) then "종료"
                 else null end))')

echo "$MERGED" | jq '[.[] | select(.timing == "종료")]' > "$DIR/expected_ended.json"
echo "$MERGED" | jq '[.[] | select(.timing != "종료")]' > "$DIR/expected_items.json"
echo "기대값 저장: expected_items.json, expected_ended.json (기준일 $TODAY)"
