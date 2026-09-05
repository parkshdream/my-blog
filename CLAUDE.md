# my-blog

마크다운(.md) 파일을 읽어서 정적 블로그 웹사이트로 변환하는 프로젝트.

## 핵심 제약

- **프레임워크 사용 금지.** React, Vue, Next.js, 정적 사이트 생성기(Hugo, Jekyll, Gatsby 등) 모두 쓰지 않는다.
- **순수 HTML + CSS + JavaScript(바닐라)만** 사용한다. 번들러, 트랜스파일러, npm 빌드 파이프라인도 두지 않는다.
- 외부 라이브러리를 추가하더라도 최소화하고(예: 마크다운 파서 하나 정도는 허용), CDN 스크립트 한 줄로 끝나는 수준을 유지한다.

## 디자인 요구사항

- 깔끔하고 읽기 좋은 타이포그래피 중심 레이아웃 (본문 가독성이 최우선).
- **다크모드 지원 필수** — `prefers-color-scheme`을 기본으로 따르고, 수동 토글도 제공.
- **모바일 반응형 필수** — 좁은 화면에서도 레이아웃이 깨지지 않아야 함.
- 과한 장식/애니메이션보다 여백과 대비, 폰트 크기 위주로 완성도를 낸다.

## 아키텍처 (확정됨)

**빌드 스크립트 방식**을 채택했다. `build.js`(Node.js)가 `posts/*.md`를 읽어 정적 `.html`로 미리 변환해 `dist/`에 출력한다. Node/npm은 빌드 타임에만 관여하며, `dist/`에 배포되는 산출물은 순수 HTML/CSS/바닐라 JS만 포함한다(프레임워크·번들러 없음). 새 글은 `posts/`에 `.md` 파일을 추가하고 `npm run build`를 다시 실행하면 반영된다.

## 파일 구조 (실제)

```
my-blog/
  package.json          # devDependencies: gray-matter, marked / scripts: build, preview
  build.js              # 빌드 스크립트 (posts/*.md -> dist/**/*.html)
  .gitignore             # node_modules/, dist/
  templates/
    index.html            # 글 목록 페이지 템플릿 ({{posts}} 치환)
    post.html             # 개별 글 템플릿 ({{title}} {{date}} {{tags}} {{content}} 등 치환)
  css/
    style.css             # CSS 변수 기반 라이트/다크 테마, 반응형(600px 브레이크포인트)
  js/
    theme.js              # 다크모드 수동 토글 (localStorage 저장, 시스템 설정 기본값)
  posts/
    *.md                  # front matter(title, date, tags, description) + 본문
  scripts/
    serve-dist.js          # 로컬 미리보기용 정적 서버 (npm run preview)
  dist/                  # 빌드 산출물 (git 미추적, npm run build로 생성)
```

## 작업 시 유의사항

- 글 추가/수정 후에는 반드시 `npm run build`를 실행해야 `dist/`에 반영된다.
- `title`, `date`는 front matter 필수 항목이다 — 없으면 build.js가 파일명을 포함한 에러를 내고 중단한다.
- 템플릿의 `{{key}}` 치환은 `build.js`의 `render()` 정규식 치환 함수 하나로 처리한다. 별도 템플릿 엔진을 추가하지 말 것.
- 다크모드는 `css/style.css`의 `:root`(라이트 기본값) → `@media (prefers-color-scheme: dark)` → `:root[data-theme="dark"/"light"]` 순으로 오버라이드되는 구조를 따른다. 새 색상을 추가할 때도 이 세 곳을 함께 갱신할 것.
- `npm run preview`는 `npx serve` 대신 `scripts/serve-dist.js`(Node 내장 http 모듈)를 사용한다 — 이 개발 환경의 PATH에 npx/node가 잡혀 있지 않아도 `.claude/launch.json`에 Node 실행파일 전체 경로로 지정되어 있으므로 그대로 동작한다.
