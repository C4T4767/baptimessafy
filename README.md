# 멀티캠퍼스 식단 자동화 시스템

멀티캠퍼스 **20층 / 10층 식당 식단 정보를 자동으로 수집·가공·배포**하는 저장소입니다.  
수집한 식단 데이터는 JSON으로 관리되며, Chrome Extension에서 바로 사용할 수 있습니다.

---

# 📋 개요

이 프로젝트는 두 가지 식단 소스를 자동화합니다.

### 20층 식단
- Welstory API 기반
- 매일 자동 실행
- 최근 7일치 식단 데이터를 `data/`에 저장

### 10층 식단
- Mattermost에 업로드된 주간 식단표 PNG 기반
- GitHub Actions가 이미지를 자동 수집
- Google Gemini API로 이미지 파싱
- 결과 JSON을 `data-10f/`에 저장

---

# 🏗️ 프로젝트 구조

```
.
├── .github/
│   └── workflows/
│       ├── fetch-menu.yml
│       ├── fetch-ssafy-menu.yml
│       └── parse-10f-menu.yml
├── data/
├── data-10f/
├── images/
├── multicampus-menu-extension/
├── fetch-menu.js
└── parse-10f-menu.js
```

---

# ⚙️ 동작 방식

## 20층 식단 수집 흐름

```
Welstory API
   ↓
GitHub Actions
   ↓
fetch-menu.js
   ↓
data/YYYY-MM-DD.json 생성
```

## 10층 식단 수집 및 파싱 흐름

```
Mattermost 식단표 업로드
   ↓
GitHub Actions (fetch-ssafy-menu.yml)
   ↓
images/ 에 최신 10층 식단표 PNG 저장
   ↓
GitHub Actions (parse-10f-menu.yml)
   ↓
parse-10f-menu.js 실행
   ↓
data-10f/YYYY-MM-DD.json 생성
```

---

# 🚀 설정 방법

## 1️⃣ GitHub Secrets 설정

## 20층 식단용

```
WELSTORY_USERNAME
WELSTORY_PASSWORD
```

## 10층 식단 파싱용

```
GEMINI_API_KEY
```

API Key 발급

```
https://aistudio.google.com/app/apikey
```

## 10층 자동 수집용

```
MM_LOGIN_JSON
GH_PAT
```

### MM_LOGIN_JSON 예시

```
{
  "login_id": "your_id",
  "password": "your_password",
  "token": "",
  "deviceId": ""
}
```

### GH_PAT 권한

```
Repository access: Only this repository
Permissions: Contents -> Read and Write
```

---

# 🤖 자동 실행 워크플로

## 1️⃣ 20층 식단 자동 수집

```
workflow: fetch-menu.yml
schedule: 매일 실행
output: data/YYYY-MM-DD.json
```

## 2️⃣ 10층 식단 이미지 자동 수집

```
workflow: fetch-ssafy-menu.yml
schedule: 평일 오전 9시
```

동작

```
Mattermost 로그인
→ 최신 식단표 게시글 조회
→ 10층 PNG 선택
→ images/ 저장
→ Git push
```

## 3️⃣ 10층 식단 PNG 파싱

```
workflow: parse-10f-menu.yml
trigger: images/** 변경
```

동작

```
PNG 파싱
→ JSON 생성
→ data-10f 저장
→ 성공 시 images PNG 삭제
```

---

# 🧪 수동 실행 방법

## 20층 식단 수동 실행

GitHub Actions 탭에서

```
Fetch Menu Data
```

워크플로 실행

---

## 10층 식단 수동 실행

### 방법 1

GitHub Actions에서

```
Fetch SSAFY 10F Menu Image
```

워크플로 실행

### 방법 2

```
cp "멀티캠퍼스(10층)_주간식단.png" images/

git add images/
git commit -m "Add 10F menu image"
git push
```

---

# 📊 JSON 데이터 형식

## 20층 식단

```
data/YYYY-MM-DD.json
```

```
{
  "date": "2026-01-06",
  "restaurant": "멀티캠퍼스",
  "mealTime": "점심",
  "meals": [
    {
      "name": "대파육개장",
      "courseName": "A:한식",
      "setName": "대파육개장&오징어완자전"
    }
  ],
  "updatedAt": "2026-01-06T04:26:27.220Z"
}
```

## 10층 식단

```
data-10f/YYYY-MM-DD.json
```

```
{
  "date": "2026-01-06",
  "restaurant": "멀티캠퍼스 10층",
  "mealTime": "점심",
  "meals": [
    {
      "name": "메뉴 이름",
      "courseName": "10층 식단"
    }
  ],
  "updatedAt": "2026-01-06T04:26:27.220Z"
}
```

---

# 🧪 로컬 테스트

## 20층 식단 수집

```
export WELSTORY_USERNAME="your_username"
export WELSTORY_PASSWORD="your_password"

node fetch-menu.js
```

## 10층 식단 파싱

```
export GEMINI_API_KEY="your_gemini_api_key"

node parse-10f-menu.js images/menu.png
```

---

# 🌐 Chrome Extension


### [Bap Time with SSAFY](https://chromewebstore.google.com/detail/beminaoknafglpdlnjlconallpkhfgdm?utm_source=item-share-cb)

브라우저에서 식단 확인 가능

---

# ⚠️ 주의 사항

```
images/ 폴더는 임시 저장 폴더입니다.
파싱 성공 시 PNG는 삭제됩니다.
최종 데이터는 data-10f 폴더에 저장됩니다.
```

```
MM_LOGIN_JSON에는 비밀번호가 포함되므로
GitHub Secrets에만 저장해야 합니다.
```

```
GH_PAT는 workflow chain을 위해 사용됩니다.
권한은 최소로 설정하세요.
```

---

# 📄 라이선스

MIT License

---

# 🤝 기여

Issue 및 Pull Request 환영합니다.
