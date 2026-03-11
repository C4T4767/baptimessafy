/**
 * Welstory Menu Viewer - Dual Floor Version
 */

// GitHub raw URLs
const GITHUB_RAW_URL_20F = 'https://raw.githubusercontent.com/C4T4767/ssabap/main/data'
const GITHUB_RAW_URL_10F = 'https://raw.githubusercontent.com/C4T4767/ssabap/main/data-10f'

// DOM 요소
const dateInput = document.getElementById('dateInput')
const prevDayBtn = document.getElementById('prevDayBtn')
const nextDayBtn = document.getElementById('nextDayBtn')
const meals20FContainer = document.getElementById('meals20FContainer')
const meals10FContainer = document.getElementById('meals10FContainer')

/**
 * KST 기준 현재 날짜를 반환 (0:00 기준)
 */
function getKSTDate() {
    const now = new Date()
    // UTC 시간에 9시간(KST offset)을 더해서 KST 날짜 계산
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
    // 시간 부분을 0으로 설정하여 날짜만 반환
    kstTime.setUTCHours(0, 0, 0, 0)
    return kstTime
}

// 요일 표시 업데이트
function updateDayOfWeek() {
    const date = new Date(dateInput.value)
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']
    const dayOfWeek = days[date.getDay()]

    const dayDisplay = document.getElementById('dayDisplay')
    if (dayDisplay) {
        dayDisplay.textContent = dayOfWeek
    }
}

// 초기화
document.addEventListener('DOMContentLoaded', () => {
    const today = getKSTDate()
    dateInput.valueAsDate = today
    updateDayOfWeek()
    loadAllMenus()
    initQuickLinks()
})

/**
 * 모든 메뉴 로드 (20층 + 10층)
 */
async function loadAllMenus() {
    const date = dateInput.value

    if (!date) {
        return
    }

    try {
        meals20FContainer.innerHTML = ''
        meals10FContainer.innerHTML = ''

        // 20층과 10층 메뉴를 동시에 로드
        const [data20F, data10F] = await Promise.all([
            fetchMenu(GITHUB_RAW_URL_20F, date),
            fetchMenu(GITHUB_RAW_URL_10F, date)
        ])

        // 20층 메뉴 표시
        if (data20F && data20F.meals && data20F.meals.length > 0) {
            display20FMeals(data20F.meals)
        } else {
            meals20FContainer.innerHTML = '<p class="no-data">해당 날짜에 메뉴가 없습니다</p>'
        }

        // 10층 메뉴 표시
        if (data10F && data10F.meals && data10F.meals.length > 0) {
            display10FMeals(data10F.meals)
        } else {
            meals10FContainer.innerHTML = '<p class="no-data">해당 날짜에 메뉴가 없습니다</p>'
        }
    } catch (error) {
        console.error('메뉴 로드 실패:', error)
    } finally {
    }
}

/**
 * 메뉴 데이터 가져오기
 */
async function fetchMenu(baseUrl, date) {
    try {
        // 캐시 무효화를 위한 타임스탬프 추가
        const timestamp = Math.floor(Date.now() / 60000) // 1분마다 갱신
        const url = `${baseUrl}/${date}.json?t=${timestamp}`
        console.log('Fetching:', url)

        const response = await fetch(url)

        if (!response.ok) {
            console.warn(`데이터를 찾을 수 없습니다: ${url}`)
            return null
        }

        return await response.json()
    } catch (error) {
        console.error('Fetch error:', error)
        return null
    }
}

/**
 * 20층 메뉴 표시 (압축 보드형)
 */
function display20FMeals(meals) {
    meals20FContainer.innerHTML = ''

    meals.forEach(meal => {
        const mealCard = document.createElement('div')
        mealCard.className = 'meal-board'

        // 총 칼로리 계산
        const totalCalories = meal.nutrition ? meal.nutrition.reduce((sum, item) => sum + item.calorie, 0) : 0
        const mainDish = meal.nutrition ? meal.nutrition.find(item => item.isMain) : null

        // 헤더 (코스명 | 메인메뉴 | 총칼로리 | 아이콘)
        const header = document.createElement('div')
        header.className = 'board-header'
        header.innerHTML = `
            <div class="board-title">
                <span class="course-badge">${meal.courseName}</span>
                <span class="main-dish">${mainDish ? mainDish.name : meal.name}</span>
                ${mainDish ? '<span class="star">⭐</span>' : ''}
            </div>
            <div class="board-actions">
                <span class="total-cal">${totalCalories} kcal</span>
                ${meal.nutrition && meal.nutrition.length > 0 ? '<button class="icon-btn" data-action="nutrition" title="영양 정보">ℹ️</button>' : ''}
            </div>
        `
        mealCard.appendChild(header)

        // 메뉴 + 이미지 컨테이너
        const contentContainer = document.createElement('div')
        contentContainer.className = 'board-content'

        // 구성 메뉴 (인라인 리스트)
        if (meal.nutrition && meal.nutrition.length > 0) {
            const menuList = document.createElement('div')
            menuList.className = 'inline-menu-list'

            const items = meal.nutrition.map(item => {
                return `<span class="menu-chip">${item.name} <span class="chip-cal">${item.calorie}</span></span>`
            }).join('')

            menuList.innerHTML = items
            contentContainer.appendChild(menuList)
        }

        // 썸네일 이미지 (오른쪽)
        if (meal.photoUrl) {
            const thumbnail = document.createElement('img')
            thumbnail.src = meal.photoUrl
            thumbnail.alt = meal.name
            thumbnail.className = 'board-thumbnail'
            thumbnail.onerror = () => thumbnail.style.display = 'none'
            thumbnail.onclick = () => {
                const modal = mealCard.querySelector('.image-modal')
                if (modal) modal.classList.toggle('hidden')
            }
            contentContainer.appendChild(thumbnail)

            // 이미지 모달
            const imageModal = document.createElement('div')
            imageModal.className = 'image-modal hidden'
            imageModal.innerHTML = `
                <div class="modal-content">
                    <img src="${meal.photoUrl}" alt="${meal.name}">
                    <button class="modal-close">✕</button>
                </div>
            `
            mealCard.appendChild(imageModal)

            const closeBtn = imageModal.querySelector('.modal-close')
            if (closeBtn) closeBtn.onclick = () => imageModal.classList.add('hidden')
        }

        mealCard.appendChild(contentContainer)

        // 영양정보 (숨김 상태)
        if (meal.nutrition && meal.nutrition.length > 0) {
            const nutritionPanel = document.createElement('div')
            nutritionPanel.className = 'nutrition-panel hidden'

            let html = '<table class="compact-nutrition"><tr><th>메뉴</th><th>칼로리</th><th>탄수</th><th>단백</th><th>지방</th></tr>'
            meal.nutrition.forEach(n => {
                html += `<tr>
                    <td>${n.name}${n.isMain ? ' ⭐' : ''}</td>
                    <td>${n.calorie}</td>
                    <td>${n.carbohydrate}g</td>
                    <td>${n.protein}g</td>
                    <td>${n.fat}g</td>
                </tr>`
            })
            html += '</table>'
            nutritionPanel.innerHTML = html
            mealCard.appendChild(nutritionPanel)
        }

        // 영양정보 버튼 이벤트
        const nutritionBtn = mealCard.querySelector('[data-action="nutrition"]')
        const nutritionPanel = mealCard.querySelector('.nutrition-panel')

        if (nutritionBtn && nutritionPanel) {
            nutritionBtn.onclick = () => nutritionPanel.classList.toggle('hidden')
        }

        meals20FContainer.appendChild(mealCard)
    })
}

/**
 * 메뉴/이미지 뷰 토글
 */
function toggleView(mealCard, view) {
    const menuList = mealCard.querySelector('.detailed-menu-list')
    const image = mealCard.querySelector('.meal-photo')
    const buttons = mealCard.querySelectorAll('.btn-toggle')

    if (view === 'menu') {
        if (menuList) menuList.classList.remove('hidden')
        if (image) image.classList.add('hidden')
        buttons[0].classList.add('active')
        buttons[1].classList.remove('active')
    } else {
        if (menuList) menuList.classList.add('hidden')
        if (image) image.classList.remove('hidden')
        buttons[0].classList.remove('active')
        buttons[1].classList.add('active')
    }
}

/**
 * 10층 메뉴 표시 (압축 칩 형식)
 */
function display10FMeals(meals) {
    meals10FContainer.innerHTML = ''

    meals.forEach(meal => {
        const mealBoard = document.createElement('div')
        mealBoard.className = 'meal-board meal-board-10f'

        const header = document.createElement('div')
        header.className = 'board-header-10f'
        header.innerHTML = `<span class="course-badge-10f">${meal.courseName}</span>`
        mealBoard.appendChild(header)

        // items 배열을 인라인 칩으로 표시
        if (meal.items && meal.items.length > 0) {
            const chipList = document.createElement('div')
            chipList.className = 'chip-list-10f'

            const chips = meal.items.map(item =>
                `<span class="menu-chip-10f">• ${item}</span>`
            ).join('')

            chipList.innerHTML = chips
            mealBoard.appendChild(chipList)
        }

        meals10FContainer.appendChild(mealBoard)
    })
}

/**
 * 영양 정보 토글
 */
function toggleNutrition(mealCard, nutrition) {
    const nutritionDiv = mealCard.querySelector('.nutrition-info')

    if (!nutritionDiv.classList.contains('hidden')) {
        nutritionDiv.classList.add('hidden')
        return
    }

    let html = '<table class="nutrition-table"><thead><tr><th>메뉴</th><th>칼로리</th><th>탄수화물</th><th>단백질</th><th>지방</th></tr></thead><tbody>'

    nutrition.forEach(n => {
        html += `
            <tr>
                <td>${n.name}${n.isMain ? ' ⭐' : ''}</td>
                <td>${n.calorie}kcal</td>
                <td>${n.carbohydrate}g</td>
                <td>${n.protein}g</td>
                <td>${n.fat}g</td>
            </tr>
        `
    })

    html += '</tbody></table>'
    nutritionDiv.innerHTML = html
    nutritionDiv.classList.remove('hidden')
}

// 날짜 변경 이벤트
dateInput.addEventListener('change', () => {
    updateDayOfWeek()
    loadAllMenus()
})

// 이전 날짜
prevDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() - 1)
    dateInput.valueAsDate = currentDate
    updateDayOfWeek()
    loadAllMenus()
})

// 다음 날짜
nextDayBtn.addEventListener('click', () => {
    const currentDate = new Date(dateInput.value)
    currentDate.setDate(currentDate.getDate() + 1)
    dateInput.valueAsDate = currentDate
    updateDayOfWeek()
    loadAllMenus()
})

/**
 * 메뉴 골라주기 (룰렛) 로직
 */
const menuPickerBtn = document.getElementById('menuPickerBtn')

if (menuPickerBtn) {
    menuPickerBtn.addEventListener('click', () => {
        const allMeals = document.querySelectorAll('.meal-board')

        if (allMeals.length === 0) {
            alert('선택할 메뉴가 없습니다. 날짜를 확인해주세요.')
            return
        }

        // 3. Easter Egg: 연속 10회 클릭 시 "이제 골라주세요.."
        const now = Date.now()
        const lastClickTime = parseInt(localStorage.getItem('menuPickerLastClickTime') || '0')
        let streak = parseInt(localStorage.getItem('menuPickerStreak') || '0')

        // 5분(300,000ms) 이내에 다시 클릭했으면 연속 클릭으로 인정
        if (now - lastClickTime < 5 * 60 * 1000) {
            streak++
        } else {
            streak = 1
        }
        localStorage.setItem('menuPickerLastClickTime', now.toString())
        localStorage.setItem('menuPickerStreak', streak.toString())

        if (streak >= 10) {
            menuPickerBtn.disabled = true
            menuPickerBtn.innerHTML = '이제 골라주세요.. <img src="icons/pepe128.png" width="16" height="16" style="vertical-align: middle; margin-left: 4px;">' // 페페 이미지 (128x128 원본을 16x16으로 리사이징하여 표시)

            // 5초 후 리셋
            setTimeout(() => {
                menuPickerBtn.disabled = false
                menuPickerBtn.textContent = '🎲 오늘의 메뉴 골라주기'
                localStorage.setItem('menuPickerStreak', '0') // 스트릭 초기화
            }, 5000)

            return // 룰렛 돌리지 않음
        }

        // 버튼 비활성화 (중복 클릭 방지)
        menuPickerBtn.disabled = true
        menuPickerBtn.textContent = '🎲 고르는 중...'

        // 30 ~ 40 사이의 랜덤 숫자 생성 (USER REQUEST: 30~40)
        const steps = Math.floor(Math.random() * 11) + 30
        let currentStep = 0

        // 시작 위치를 0~4 사이에서 랜덤으로 결정 (USER REQUEST: 1~5로 시작)
        // 단, 메뉴 개수가 5개보다 적을 수도 있으므로 Math.min 사용
        let currentIndex = Math.floor(Math.random() * Math.min(5, allMeals.length))

        // 애니메이션 속도 조절 (점점 느려지게 할 수도 있지만, 일단 일정하게)
        const intervalTime = 100

        function highlightNext() {
            // 이전 하이라이트 제거
            allMeals.forEach(meal => meal.classList.remove('highlight'))

            // 다음 메뉴 하이라이트
            const targetIndex = currentIndex % allMeals.length
            const targetMeal = allMeals[targetIndex]

            targetMeal.classList.add('highlight')
            targetMeal.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

            currentIndex++
            currentStep++

            if (currentStep < steps) {
                // 다음 단계로
                // 룰렛 느낌을 위해 마지막 10단계는 점점 느려지게
                let nextDelay = intervalTime
                if (steps - currentStep < 10) {
                    nextDelay += (10 - (steps - currentStep)) * 30
                }

                setTimeout(highlightNext, nextDelay)
            } else {
                // 종료
                setTimeout(() => {
                    const finalMealName = targetMeal.querySelector('.main-dish')?.textContent ||
                        targetMeal.querySelector('.menu-chip-10f')?.textContent?.replace('•', '') ||
                        '이 메뉴'

                    // 모달 표시
                    const resultModal = document.getElementById('resultModal')
                    const resultMenuName = document.getElementById('resultMenuName')

                    if (resultModal && resultMenuName) {
                        resultMenuName.textContent = finalMealName.trim()
                        resultModal.classList.remove('hidden')

                        // 폭죽 효과 (선택 사항)
                        // confetti() 
                    } else {
                        // 모달이 없으면 기존 alert (fallback)
                        alert(`🎉 오늘의 추천 메뉴는\n[${finalMealName.trim()}]\n입니다! 맛점하세요!`)
                    }

                    menuPickerBtn.disabled = false
                    menuPickerBtn.textContent = '🎲 오늘의 메뉴 골라주기'
                }, 500)
            }
        }

        highlightNext()
    })
}

// 모달 닫기 로직
const resultModal = document.getElementById('resultModal')
const closeBtn = document.querySelector('.close-btn')
const closeResultBtn = document.getElementById('closeResultBtn')

function closeModal() {
    if (resultModal) {
        resultModal.classList.add('hidden')
    }
}

if (closeBtn) closeBtn.addEventListener('click', closeModal)
if (closeResultBtn) closeResultBtn.addEventListener('click', closeModal)
if (resultModal) {
    resultModal.addEventListener('click', (e) => {
        if (e.target === resultModal) {
            closeModal()
        }
    })
}

// --- 즐겨찾기 (Quick Links) 기능 ---
const DEFAULT_LINKS = [
    { id: 'default-1', name: 'Edu SSAFY', url: 'https://edu.ssafy.com', isDefault: true }
]

let quickLinks = []
let isEditMode = false
let isExpanded = false
// 드래그 정렬 상태값
let draggedLinkId = null
// 기본 브라우저 ghost 이미지 숨김용 1x1 이미지
let invisibleDragImage = null
// 커스텀 드래그 미리보기 엘리먼트
let dragPreviewEl = null

// 팝업 영역 전체에서 dragover/drop 기본동작을 막아 커서 상태(금지/링크 표시) 깜빡임 완화
document.addEventListener('dragover', (e) => {
    if (!isEditMode || !draggedLinkId) return
    e.preventDefault()
    if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'move'
    }
    moveDragPreview(e)
})

document.addEventListener('drop', (e) => {
    if (!isEditMode || !draggedLinkId) return
    e.preventDefault()
})

function initQuickLinks() {
    chrome.storage.sync.get({ quickLinks: DEFAULT_LINKS }, (data) => {
        quickLinks = data.quickLinks
        renderQuickLinks()
    })
}

function saveQuickLinks() {
    chrome.storage.sync.set({ quickLinks }, () => {
        renderQuickLinks()
    })
}

function renderQuickLinks() {
    const grid = document.getElementById('quickLinksGrid')
    const panel = document.getElementById('quickLinksPanel')
    if (!grid) return
    grid.innerHTML = ''

    if (isEditMode) {
        grid.classList.add('edit-mode')
        if (panel) panel.classList.add('edit-mode')
    } else {
        grid.classList.remove('edit-mode')
        if (panel) panel.classList.remove('edit-mode')
    }

    const allItems = []

    quickLinks.forEach(link => {
        const item = document.createElement('a')
        item.className = 'quick-link-item user-link-item'
        item.draggable = isEditMode

        item.onclick = (e) => {
            if (isEditMode) {
                e.preventDefault()
            } else {
                item.href = link.url
                item.target = '_blank'
            }
        }

        let domain = ''
        try {
            domain = new URL(link.url).hostname
        } catch (e) { }

        const favIconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`

        let badgeHtml = ''
        if (isEditMode && !link.isDefault) {
            badgeHtml = `<div class="delete-badge" data-id="${link.id}">×</div>`
        }

        item.innerHTML = `
            ${badgeHtml}
            <div class="quick-link-icon">
                <img src="${favIconUrl}" alt="icon" onerror="this.style.display='none'">
            </div>
            <span class="quick-link-name">${link.name}</span>
        `
        const iconImg = item.querySelector('.quick-link-icon img')
        if (iconImg) {
            iconImg.draggable = false
        }

        if (isEditMode && !link.isDefault) {
            const badge = item.querySelector('.delete-badge')
            if (badge) {
                badge.onclick = (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    quickLinks = quickLinks.filter(l => l.id !== link.id)
                    saveQuickLinks()
                }
            }
        }

        if (isEditMode) {
            item.addEventListener('dragstart', (e) => {
                draggedLinkId = link.id
                item.classList.add('dragging')
                // "카드 통째로 따라오는" 시각 피드백용 프리뷰 생성
                createDragPreview(item)
                if (e.dataTransfer) {
                    e.dataTransfer.effectAllowed = 'move'
                    e.dataTransfer.setData('text/plain', link.id)
                    // 브라우저 기본 ghost는 숨기고 커스텀 프리뷰만 노출
                    e.dataTransfer.setDragImage(getInvisibleDragImage(), 0, 0)
                }
                moveDragPreview(e)
            })

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging')
                draggedLinkId = null
                grid.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'))
                removeDragPreview()
            })

            item.addEventListener('dragover', (e) => {
                if (!draggedLinkId || draggedLinkId === link.id) return
                e.preventDefault()
                if (e.dataTransfer) {
                    e.dataTransfer.dropEffect = 'move'
                }
                moveDragPreview(e)
                item.classList.add('drag-over')
            })

            item.addEventListener('dragleave', () => {
                item.classList.remove('drag-over')
            })

            item.addEventListener('drop', (e) => {
                e.preventDefault()
                item.classList.remove('drag-over')
                // source -> target 위치로 배열 순서를 바꿔 저장
                reorderQuickLink(draggedLinkId, link.id)
            })
        }

        allItems.push(item)
    })

    if (quickLinks.length < 10) {
        const addBtn = document.createElement('div')
        addBtn.className = 'quick-link-item action-link-btn add-link-btn'
        addBtn.title = '추가'

        // 심플한 크로스(+) SVG 아이콘
        const addIconSvg = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`

        addBtn.innerHTML = `
            <div class="quick-link-icon">${addIconSvg}</div>
            <span class="quick-link-name">추가</span>
        `
        addBtn.onclick = () => {
            document.getElementById('addLinkForm').classList.remove('hidden')
            document.getElementById('newLinkName').focus()
        }
        allItems.push(addBtn)
    }

    // 설정(편집) 버튼을 그리드 맨 끝에 항상 추가
    const settingsBtn = document.createElement('div')
    settingsBtn.className = `quick-link-item action-link-btn settings-link-btn ${isEditMode ? 'active' : ''}`
    settingsBtn.title = isEditMode ? '완료' : '설정'

    // 심플한 톱니바퀴 SVG 아이콘
    const settingsIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`
    // 심플한 체크마크 SVG 아이콘
    const checkIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>`

    settingsBtn.innerHTML = `
        <div class="quick-link-icon">
            ${isEditMode ? checkIconSvg : settingsIconSvg}
        </div>
        <span class="quick-link-name">${isEditMode ? '완료' : '설정'}</span>
    `
    settingsBtn.onclick = () => {
        isEditMode = !isEditMode
        document.getElementById('addLinkForm').classList.add('hidden')
        renderQuickLinks()
    }
    allItems.push(settingsBtn)

    // 노출 로직 (기본 5개 노출, 총 아이템 개수가 5개를 초과하면 4개 + 1개(더보기) 로 변경)
    if (!isExpanded && allItems.length > 5) {
        const visibleItems = allItems.slice(0, 4)

        const moreBtn = document.createElement('div')
        moreBtn.className = 'quick-link-item action-link-btn more-link-btn'
        moreBtn.title = '더보기'

        // 더보기(점 3개) SVG 아이콘
        const moreIconSvg = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>`

        moreBtn.innerHTML = `
            <div class="quick-link-icon">${moreIconSvg}</div>
            <span class="quick-link-name">더보기</span>
        `
        moreBtn.onclick = () => {
            isExpanded = true
            renderQuickLinks()
        }
        visibleItems.push(moreBtn)

        visibleItems.forEach(el => grid.appendChild(el))
    } else {
        allItems.forEach(el => grid.appendChild(el))

        if (isExpanded) {
            // 접기 버튼 (선택사항, 너무 길어지면 닫을 수 있도록 함)
            const lessBtn = document.createElement('div')
            lessBtn.className = 'quick-link-item action-link-btn less-link-btn'
            lessBtn.title = '접기'

            // 위로 향하는 화살표 SVG 아이콘
            const lessIconSvg = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>`

            lessBtn.innerHTML = `
                <div class="quick-link-icon">${lessIconSvg}</div>
                <span class="quick-link-name">접기</span>
            `
            lessBtn.onclick = () => {
                isExpanded = false
                renderQuickLinks()
            }
            grid.appendChild(lessBtn)
        }
    }
}

// (동적 렌더링으로 이동하므로 HTML 상의 버튼 이벤트 할당 제거 또는 예외처리용 더미로 남김)
const editLinksBtn = document.getElementById('editLinksBtn')
if (editLinksBtn) {
    editLinksBtn.onclick = () => {
        isEditMode = !isEditMode
        document.getElementById('addLinkForm').classList.add('hidden')
        renderQuickLinks()
    }
}

const cancelAddLinkBtn = document.getElementById('cancelAddLinkBtn')
if (cancelAddLinkBtn) {
    cancelAddLinkBtn.onclick = (e) => {
        e.preventDefault()
        document.getElementById('addLinkForm').classList.add('hidden')
        document.getElementById('newLinkName').value = ''
        document.getElementById('newLinkUrl').value = ''
    }
}

const saveLinkBtn = document.getElementById('saveLinkBtn')
if (saveLinkBtn) {
    saveLinkBtn.onclick = (e) => {
        e.preventDefault()
        const nameInput = document.getElementById('newLinkName')
        const urlInput = document.getElementById('newLinkUrl')
        const name = nameInput.value.trim()
        let url = urlInput.value.trim()

        if (!name || !url) {
            alert('이름과 URL을 모두 입력해주세요.')
            return
        }

        if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url
        }

        quickLinks.push({
            id: 'link-' + Date.now(),
            name,
            url,
            isDefault: false
        })

        saveQuickLinks()

        document.getElementById('addLinkForm').classList.add('hidden')
        nameInput.value = ''
        urlInput.value = ''
    }
}

function reorderQuickLink(sourceId, targetId) {
    if (!sourceId || !targetId || sourceId === targetId) {
        return
    }

    const fromIndex = quickLinks.findIndex(link => link.id === sourceId)
    const toIndex = quickLinks.findIndex(link => link.id === targetId)
    if (fromIndex < 0 || toIndex < 0) {
        return
    }

    const [moved] = quickLinks.splice(fromIndex, 1)
    quickLinks.splice(toIndex, 0, moved)
    saveQuickLinks()
}

function getInvisibleDragImage() {
    if (invisibleDragImage) {
        return invisibleDragImage
    }

    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    invisibleDragImage = canvas
    return invisibleDragImage
}

function createDragPreview(sourceItem) {
    removeDragPreview()

    const preview = sourceItem.cloneNode(true)
    preview.classList.add('quick-link-drag-preview')
    // 프리뷰에서는 삭제 배지를 숨겨 시각적 노이즈 최소화
    preview.querySelectorAll('.delete-badge').forEach(badge => badge.remove())
    preview.style.width = `${sourceItem.offsetWidth}px`

    dragPreviewEl = preview
    document.body.appendChild(dragPreviewEl)
}

function moveDragPreview(e) {
    if (!dragPreviewEl || typeof e.clientX !== 'number' || typeof e.clientY !== 'number') {
        return
    }

    dragPreviewEl.style.left = `${e.clientX}px`
    dragPreviewEl.style.top = `${e.clientY}px`
}

function removeDragPreview() {
    if (dragPreviewEl) {
        dragPreviewEl.remove()
        dragPreviewEl = null
    }
}
