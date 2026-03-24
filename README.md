# 멀티캠퍼스 식단 자동화 시스템
<img width="640" height="400" alt="스크린샷 2026-03-14 004514" src="https://github.com/user-attachments/assets/664ecca0-3c18-4b21-a259-aed56901d3ac" />

> SSAFY 멀티캠퍼스 **20층 / 10층 식당 식단 정보를 자동으로 수집·가공·배포**하는 시스템입니다.  
> 20층 식단은 **Welstory API** 기반으로 수집하고, 10층 식단은 **Mattermost에 업로드된 주간 식단표 PNG**를 자동 수집한 뒤 **Google Gemini API**로 파싱합니다.  
> 최종 데이터는 JSON으로 저장되며, Chrome Extension **Bap Time with SSAFY**에서 바로 사용할 수 있습니다.


---

## 서비스 링크

- Chrome Web Store: [Bap Time with SSAFY](https://chromewebstore.google.com/detail/beminaoknafglpdlnjlconallpkhfgdm)

> 작성 시점 기준
> - 사용자 **461명**
> - 평점 **5.0 / 5.0** (리뷰 7개)

<!-- 크롬 웹스토어 캡처 파일 위치: docs/images/chrome-web-store.png -->
<img width="459" height="193" alt="image" src="https://github.com/user-attachments/assets/44e63ae5-cabb-4b5f-b1af-97977b9e5b25" />


---

## 프로젝트 배경

멀티캠퍼스 식단 정보는 층별로 제공 방식이 다릅니다.

- **20층 식단**은 API 기반으로 조회 가능
- **10층 식단**은 주간 식단표 이미지(PNG) 형태로 공유

이 프로젝트는 서로 다른 두 소스를 자동으로 수집하고, 확장 프로그램에서 바로 사용할 수 있는 **통일된 JSON 데이터**로 정규화하기 위해 만들었습니다.

---

## 주요 기능

### 1. 20층 식단 자동 수집
- Welstory API 기반 식단 수집
- GitHub Actions로 매일 자동 실행
- 결과를 `data/YYYY-MM-DD.json` 형식으로 저장
- 메뉴 이미지 URL 및 영양 정보까지 함께 관리

### 2. 10층 식단 자동 수집 및 파싱
- Mattermost에 업로드된 최신 주간 식단표 PNG 자동 수집
- `images/`에 임시 저장 후 Google Gemini API로 파싱
- 결과를 `data-10f/YYYY-MM-DD.json` 형식으로 저장
- 도시락 / 브런치 / 샐러드 등 코스 단위 식단과 개별 품목 리스트를 함께 관리

### 3. Chrome Extension 연동
- 생성된 JSON 데이터를 Chrome Extension에서 바로 사용
- 사용자는 브라우저에서 손쉽게 식단 확인 가능

---

## 동작 구조

### 20층 식단 수집 흐름

```text
Welstory API
   ↓
GitHub Actions
   ↓
fetch-menu.js
   ↓
data/YYYY-MM-DD.json 생성
```

### 10층 식단 수집 및 파싱 흐름

```text
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

## 프로젝트 구조

```text
.
├── .github/
│   └── workflows/
│       ├── fetch-menu.yml
│       ├── fetch-ssafy-menu.yml
│       └── parse-10f-menu.yml
├── data/
├── data-10f/
├── images/
├── docs/
│   └── images/
│       ├── system-overview.png
│       ├── chrome-web-store.png
│       └── extension-popup.png
├── multicampus-menu-extension/
├── fetch-menu.js
└── parse-10f-menu.js
```

---

## 자동 실행 워크플로

### 1. 20층 식단 자동 수집
- workflow: `fetch-menu.yml`
- schedule: 매일 실행
- output: `data/YYYY-MM-DD.json`

### 2. 10층 식단 이미지 자동 수집
- workflow: `fetch-ssafy-menu.yml`
- schedule: 평일 오전 9시

동작 방식

```text
Mattermost 로그인
→ 최신 식단표 게시글 조회
→ 10층 PNG 선택
→ images/ 저장
→ Git push
```

### 3. 10층 식단 PNG 파싱
- workflow: `parse-10f-menu.yml`
- trigger: `images/**` 변경

동작 방식

```text
PNG 파싱
→ JSON 생성
→ data-10f 저장
→ 성공 시 images PNG 삭제
```

---

## 설정 방법

### GitHub Secrets

#### 20층 식단용
```text
WELSTORY_USERNAME
WELSTORY_PASSWORD
```

#### 10층 식단 파싱용
```text
GEMINI_API_KEY
```

#### 10층 자동 수집용
```text
MM_LOGIN_JSON
GH_PAT
```

### MM_LOGIN_JSON 예시

```json
{
  "login_id": "your_id",
  "password": "your_password",
  "token": "",
  "deviceId": ""
}
```

### GH_PAT 권한

```text
Repository access: Only this repository
Permissions: Contents -> Read and Write
```

---

## 수동 실행 방법

### 20층 식단 수동 실행
GitHub Actions 탭에서 아래 워크플로를 실행합니다.

```text
Fetch Menu Data
```

### 10층 식단 수동 실행

#### 방법 1
GitHub Actions에서 아래 워크플로를 실행합니다.

```text
Fetch SSAFY 10F Menu Image
```

#### 방법 2
직접 이미지를 넣고 파싱을 트리거합니다.

```bash
cp "멀티캠퍼스(10층)_주간식단.png" images/

git add images/
git commit -m "Add 10F menu image"
git push
```

---

## JSON 데이터 형식

### 10층 식단 (`data-10f/YYYY-MM-DD.json`)

```json
{
  "date": "2026-03-27",
  "dayOfWeek": "금요일",
  "restaurant": "멀티캠퍼스 10층",
  "mealTime": "점심",
  "meals": [
    {
      "name": "폭찹스테이크, 꽈리고추매추리알조림, 백미밥, 호박고추장찌개, 들깨콩나물, 포기김치",
      "courseName": "도시락",
      "setName": "10층 공존식단",
      "items": [
        "폭찹스테이크",
        "꽈리고추매추리알조림",
        "백미밥",
        "호박고추장찌개",
        "들깨콩나물",
        "포기김치"
      ]
    },
    {
      "name": "함박스테이크샌드위치, & 마카로니샐러드, & 딸기드레싱, & 음료",
      "courseName": "브런치",
      "setName": "10층 공존식단",
      "items": [
        "함박스테이크샌드위치",
        "마카로니샐러드",
        "딸기드레싱",
        "음료"
      ]
    },
    {
      "name": "참치마요바게트샐러드, & 딸기드레싱, & 음료",
      "courseName": "샐러드",
      "setName": "10층 공존식단",
      "items": [
        "참치마요바게트샐러드",
        "딸기드레싱",
        "음료"
      ]
    }
  ],
  "updatedAt": "2026-03-24T02:42:06.661Z"
}
```

### 20층 식단 (`data/YYYY-MM-DD.json`)

```json
{
  "date": "2026-04-01",
  "restaurant": "멀티캠퍼스",
  "mealTime": "점심",
  "meals": [
    {
      "name": "햄버그스테이크",
      "courseName": "A:한식",
      "setName": "햄버그스테이크&토마토소스스파게티",
      "photoUrl": "http://samsungwelstory.com/data/manager/recipe/main/100026/1386.png",
      "nutrition": [
        {
          "name": "햄버그스테이크",
          "isMain": true,
          "calorie": 371,
          "carbohydrate": 19,
          "sugar": 4,
          "fiber": 4,
          "fat": 24,
          "protein": 20
        },
        {
          "name": "토마토소스스파게티",
          "isMain": false,
          "calorie": 283,
          "carbohydrate": 59,
          "sugar": 9,
          "fiber": 3,
          "fat": 2,
          "protein": 9
        },
        {
          "name": "미니현미밥&후리가케",
          "isMain": false,
          "calorie": 125,
          "carbohydrate": 29,
          "sugar": 0,
          "fiber": 0,
          "fat": 0,
          "protein": 2
        },
        {
          "name": "유부장국",
          "isMain": false,
          "calorie": 45,
          "carbohydrate": 3,
          "sugar": 2,
          "fiber": 1,
          "fat": 2,
          "protein": 3
        },
        {
          "name": "떡볶이",
          "isMain": false,
          "calorie": 354,
          "carbohydrate": 74,
          "sugar": 11,
          "fiber": 1,
          "fat": 2,
          "protein": 7
        },
        {
          "name": "반달감자튀김(웻지감자)",
          "isMain": false,
          "calorie": 168,
          "carbohydrate": 22,
          "sugar": 0,
          "fiber": 2,
          "fat": 8,
          "protein": 2
        },
        {
          "name": "더운채소",
          "isMain": false,
          "calorie": 67,
          "carbohydrate": 5,
          "sugar": 1,
          "fiber": 1,
          "fat": 5,
          "protein": 1
        },
        {
          "name": "스위트콘",
          "isMain": false,
          "calorie": 25,
          "carbohydrate": 5,
          "sugar": 2,
          "fiber": 1,
          "fat": 0,
          "protein": 1
        },
        {
          "name": "그린샐러드",
          "isMain": false,
          "calorie": 12,
          "carbohydrate": 3,
          "sugar": 1,
          "fiber": 1,
          "fat": 0,
          "protein": 1
        },
        {
          "name": "드레싱",
          "isMain": false,
          "calorie": 23,
          "carbohydrate": 4,
          "sugar": 4,
          "fiber": 0,
          "fat": 1,
          "protein": 0
        },
        {
          "name": "오이피클",
          "isMain": false,
          "calorie": 64,
          "carbohydrate": 15,
          "sugar": 16,
          "fiber": 1,
          "fat": 0,
          "protein": 0
        },
        {
          "name": "아이스티",
          "isMain": false,
          "calorie": 56,
          "carbohydrate": 14,
          "sugar": 14,
          "fiber": 0,
          "fat": 0,
          "protein": 0
        }
      ]
    }
  ],
  "updatedAt": "2026-03-23T21:25:38.759Z"
}
```

---

## 로컬 테스트

### 20층 식단 수집

```bash
export WELSTORY_USERNAME="your_username"
export WELSTORY_PASSWORD="your_password"

node fetch-menu.js
```

### 10층 식단 파싱

```bash
export GEMINI_API_KEY="your_gemini_api_key"

node parse-10f-menu.js images/menu.png
```

---

## 주의 사항

```text
images/ 폴더는 임시 저장 폴더입니다.
파싱 성공 시 PNG는 삭제됩니다.
최종 데이터는 data-10f 폴더에 저장됩니다.
```

```text
MM_LOGIN_JSON에는 비밀번호가 포함되므로
GitHub Secrets에만 저장해야 합니다.
```

```text
GH_PAT는 workflow chain을 위해 사용됩니다.
권한은 최소로 설정하세요.
```

---

## 기술 스택

- Node.js
- GitHub Actions
- Welstory API
- Mattermost
- Google Gemini API
- JSON 기반 데이터 관리
- Chrome Extension 연동

---

## 라이선스

MIT License

