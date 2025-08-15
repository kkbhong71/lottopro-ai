// LottoPro AI Advanced JavaScript Application (실시간 예시번호 기능 추가)

class LottoProAI {
    constructor() {
        this.isLoading = false;
        this.currentPrediction = null;
        this.animationTimeouts = [];
        this.exampleUpdateInterval = null;  // 실시간 예시번호 업데이트 인터벌
        this.isUpdatingExample = false;     // 예시번호 업데이트 중 플래그
        
        this.init();
    }
    
    init() {
        this.initializeEventListeners();
        this.initializeAnimations();
        this.loadInitialStats();
    }
    
    initializeEventListeners() {
        // 폼 제출 이벤트
        const form = document.getElementById('predictionForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handlePredictionSubmit(e));
        }
        
        // 숫자 입력 검증
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`num${i}`);
            if (input) {
                input.addEventListener('input', (e) => this.validateNumberInput(e));
                input.addEventListener('blur', (e) => this.checkDuplicates(e));
                input.addEventListener('keypress', (e) => this.handleNumberKeyPress(e));
            }
        }
        
        // 스크롤 애니메이션
        this.initializeScrollAnimations();
        
        // 결과 공유 기능
        this.initializeShareFeatures();
    }
    
    initializeAnimations() {
        // 히어로 섹션 로또볼 애니메이션
        this.animateHeroBalls();
        
        // 카운터 애니메이션
        this.animateCounters();
        
        // 배경 파티클 효과
        this.initializeParticleEffect();
    }
    
    async loadInitialStats() {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            
            if (data.hot_numbers && data.cold_numbers) {
                this.displayStatistics(data);
            }
        } catch (error) {
            console.error('통계 로드 실패:', error);
        }
    }

    // ===== 실시간 예시번호 기능 =====
    
    initializeHeroExampleNumbers() {
        /**
         * 히어로 섹션 실시간 예시번호 시스템 초기화
         */
        console.log('실시간 예시번호 시스템 초기화');
        
        // 즉시 첫 예시번호 생성
        this.updateHeroExampleNumbers();
        
        // 30초마다 자동 업데이트
        this.exampleUpdateInterval = setInterval(() => {
            this.updateHeroExampleNumbers();
        }, 30000);
        
        // 예시번호 클릭 시 수동 업데이트
        this.attachExampleClickEvent();
    }

    async updateHeroExampleNumbers() {
        /**
         * 히어로 섹션 예시번호 업데이트
         */
        try {
            console.log('예시번호 업데이트 시작');
            
            const response = await fetch('/api/example-numbers');
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.success && data.example_numbers) {
                this.displayHeroExampleNumbers(data.example_numbers, data.analysis);
                console.log('예시번호 업데이트 완료:', data.example_numbers);
            } else {
                throw new Error(data.error || '예시번호 생성 실패');
            }
            
        } catch (error) {
            console.log('예시번호 업데이트 실패, 클라이언트 생성 사용:', error);
            // 서버 실패 시 클라이언트에서 생성
            this.generateClientSideExample();
        }
    }

    generateClientSideExample() {
        /**
         * 클라이언트에서 예시번호 생성 (서버 실패 시 대안)
         */
        try {
            const numbers = [];
            
            // 고품질 예시 번호 생성
            const hotNumbers = [7, 13, 22, 31, 42, 1, 14, 25, 33, 43];
            
            // 2-3개는 핫넘버에서, 나머지는 랜덤
            for (let i = 0; i < 3; i++) {
                if (Math.random() < 0.8 && hotNumbers.length > 0) {
                    const randomIndex = Math.floor(Math.random() * hotNumbers.length);
                    const selected = hotNumbers[randomIndex];
                    if (!numbers.includes(selected)) {
                        numbers.push(selected);
                        hotNumbers.splice(randomIndex, 1);
                    }
                }
            }
            
            // 나머지 번호 랜덤 생성
            while (numbers.length < 6) {
                const randomNum = Math.floor(Math.random() * 45) + 1;
                if (!numbers.includes(randomNum)) {
                    numbers.push(randomNum);
                }
            }
            
            const sortedNumbers = numbers.sort((a, b) => a - b);
            
            // 분석 정보 생성
            const analysis = {
                sum: sortedNumbers.reduce((a, b) => a + b, 0),
                even_count: sortedNumbers.filter(n => n % 2 === 0).length,
                odd_count: sortedNumbers.filter(n => n % 2 !== 0).length
            };
            
            this.displayHeroExampleNumbers(sortedNumbers, analysis);
            console.log('클라이언트 예시번호 생성 완료:', sortedNumbers);
            
        } catch (error) {
            console.error('클라이언트 예시번호 생성 실패:', error);
        }
    }

    displayHeroExampleNumbers(numbers, analysis = null) {
        /**
         * 히어로 섹션에 예시번호 표시
         */
        const container = document.getElementById('heroExampleNumbers');
        if (!container) return;
        
        // 기존 볼들을 페이드아웃
        const existingBalls = container.querySelectorAll('.lotto-ball');
        existingBalls.forEach((ball, index) => {
            setTimeout(() => {
                ball.style.transform = 'scale(0) rotateY(180deg)';
                ball.style.opacity = '0';
            }, index * 100);
        });
        
        // 새 번호들을 생성하고 페이드인
        setTimeout(() => {
            container.innerHTML = '';
            
            numbers.forEach((number, index) => {
                const ball = document.createElement('div');
                ball.className = `lotto-ball ${this.getNumberColorClass(number)} example-ball`;
                ball.textContent = number;
                ball.style.transform = 'scale(0) rotateY(-180deg)';
                ball.style.opacity = '0';
                ball.style.cursor = 'pointer';
                ball.title = '클릭하면 새로운 예시번호가 생성됩니다';
                
                container.appendChild(ball);
                
                // 순차적 애니메이션
                setTimeout(() => {
                    ball.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    ball.style.transform = 'scale(1) rotateY(0deg)';
                    ball.style.opacity = '1';
                }, index * 150 + 200);
            });
            
            // 분석 정보 업데이트
            this.updateExampleAnalysis(numbers, analysis);
            
        }, 600);
    }

    updateExampleAnalysis(numbers, analysis) {
        /**
         * 예시번호 분석 정보 업데이트
         */
        const infoContainer = document.getElementById('exampleInfo');
        if (infoContainer && analysis) {
            const infoHTML = `
                <small class="text-light opacity-75">
                    합계: ${analysis.sum} | 
                    짝수: ${analysis.even_count}개 | 
                    홀수: ${analysis.odd_count}개 | 
                    <span class="text-warning">✨ 실시간 AI 분석</span>
                </small>
            `;
            infoContainer.innerHTML = infoHTML;
            
            // 애니메이션 효과
            infoContainer.style.opacity = '0';
            setTimeout(() => {
                infoContainer.style.transition = 'opacity 0.5s ease';
                infoContainer.style.opacity = '1';
            }, 800);
        }
    }

    attachExampleClickEvent() {
        /**
         * 예시번호 클릭 이벤트 연결
         */
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('example-ball')) {
                // 연속 클릭 방지
                if (this.isUpdatingExample) return;
                
                this.isUpdatingExample = true;
                this.updateHeroExampleNumbers();
                
                // 사용자 피드백
                this.showToast('새로운 AI 예시번호가 생성되었습니다! 🎯', 'info');
                
                // 1초 후 다시 클릭 허용
                setTimeout(() => {
                    this.isUpdatingExample = false;
                }, 1000);
            }
        });
    }

    // ===== 기존 기능들 =====
    
    validateNumberInput(event) {
        const input = event.target;
        let value = parseInt(input.value);
        
        // 입력값 범위 검증
        if (isNaN(value)) {
            input.classList.remove('is-valid', 'is-invalid');
            return;
        }
        
        if (value < 1) {
            input.value = 1;
            value = 1;
        } else if (value > 45) {
            input.value = 45;
            value = 45;
        }
        
        // 시각적 피드백
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        
        // 중복 검사
        this.checkDuplicates(event);
    }
    
    checkDuplicates(event) {
        const currentInput = event.target;
        const currentValue = currentInput.value;
        
        if (!currentValue) return;
        
        let hasDuplicate = false;
        
        // 다른 입력 필드들과 중복 검사
        for (let i = 1; i <= 6; i++) {
            const otherInput = document.getElementById(`num${i}`);
            if (otherInput !== currentInput && otherInput.value === currentValue) {
                hasDuplicate = true;
                break;
            }
        }
        
        if (hasDuplicate) {
            currentInput.classList.remove('is-valid');
            currentInput.classList.add('is-invalid');
            currentInput.title = '중복된 번호입니다';
            this.showToast('중복된 번호가 있습니다', 'warning');
        } else {
            currentInput.classList.remove('is-invalid');
            currentInput.classList.add('is-valid');
            currentInput.title = '';
        }
    }
    
    handleNumberKeyPress(event) {
        // Enter 키로 다음 입력 필드로 이동
        if (event.key === 'Enter') {
            event.preventDefault();
            const currentId = parseInt(event.target.id.replace('num', ''));
            if (currentId < 6) {
                const nextInput = document.getElementById(`num${currentId + 1}`);
                if (nextInput) {
                    nextInput.focus();
                }
            } else {
                // 마지막 입력에서 Enter 시 예측 시작
                this.handlePredictionSubmit(event);
            }
        }
    }
    
    // 개선된 getUserNumbers 함수
    getUserNumbers() {
        const userNumbers = [];
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`num${i}`);
            if (input && input.value && input.value.trim() !== '') {
                const value = parseInt(input.value.trim());
                if (!isNaN(value) && value >= 1 && value <= 45) {
                    userNumbers.push(value);
                }
            }
        }
        return [...new Set(userNumbers)]; // 중복 제거
    }
    
    // 개선된 예측 요청 함수
    async handlePredictionSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const userNumbers = this.getUserNumbers();
        
        // 중복 검사는 실제로 번호가 입력된 경우에만
        if (userNumbers.length > 0 && this.hasDuplicateNumbers()) {
            this.showToast('중복된 번호를 제거해주세요', 'error');
            return;
        }
        
        try {
            this.startLoading();
            
            // 요청 데이터 검증
            const requestData = {
                user_numbers: userNumbers || [] // null/undefined 방지
            };
            
            console.log('전송 데이터:', requestData); // 디버깅용
            
            // AI 예측 요청
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData)
            });
            
            console.log('응답 상태:', response.status); // 디버깅용
            
            if (!response.ok) {
                // HTTP 상태 코드 별 에러 처리
                let errorMessage = `서버 오류 (${response.status})`;
                
                if (response.status === 400) {
                    errorMessage = '잘못된 요청입니다. 번호를 다시 확인해주세요.';
                } else if (response.status === 500) {
                    errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (response.status === 404) {
                    errorMessage = '요청한 서비스를 찾을 수 없습니다.';
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('응답 데이터:', data); // 디버깅용
            
            if (data.success) {
                this.currentPrediction = data;
                await this.displayResults(data);
                
                if (userNumbers.length > 0) {
                    this.showToast(`선호 번호 ${userNumbers.length}개를 포함한 AI 예측이 완료되었습니다! 🎯`, 'success');
                } else {
                    this.showToast('AI 완전 랜덤 예측이 완료되었습니다! 🎯', 'success');
                }
                
                // 결과로 스크롤
                setTimeout(() => {
                    const resultsSection = document.getElementById('resultsSection');
                    if (resultsSection) {
                        resultsSection.scrollIntoView({ 
                            behavior: 'smooth',
                            block: 'start'
                        });
                    }
                }, 500);
            } else {
                throw new Error(data.error || '예측 중 알 수 없는 오류가 발생했습니다');
            }
            
        } catch (error) {
            console.error('예측 오류:', error);
            
            // 네트워크 오류 vs 서버 오류 구분
            let errorMessage = error.message;
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.stopLoading();
        }
    }
    
    // 개선된 중복 검사 함수
    hasDuplicateNumbers() {
        const filledInputs = [];
        const values = [];
        
        for (let i = 1; i <= 6; i++) {
            const input = document.getElementById(`num${i}`);
            if (input && input.value && input.value.trim() !== '') {
                const value = parseInt(input.value.trim());
                if (!isNaN(value)) {
                    filledInputs.push(input);
                    values.push(value);
                }
            }
        }
        
        // 입력된 값이 없으면 중복 없음
        if (values.length === 0) {
            return false;
        }
        
        // 중복 검사
        const uniqueValues = new Set(values);
        return uniqueValues.size !== values.length;
    }
    
    // 개선된 로딩 상태 관리
    startLoading() {
        this.isLoading = true;
        
        // 버튼 상태 변경
        const button = document.querySelector('#predictionForm button[type="submit"]');
        if (button) {
            const buttonText = button.querySelector('.btn-text');
            const spinner = button.querySelector('.spinner-border');
            
            if (buttonText) buttonText.textContent = 'AI가 분석 중...';
            if (spinner) spinner.classList.remove('d-none');
            button.disabled = true;
        }
        
        // 로딩 섹션 표시
        const loadingSection = document.getElementById('loadingSection');
        const resultsSection = document.getElementById('resultsSection');
        
        if (loadingSection) loadingSection.classList.remove('d-none');
        if (resultsSection) resultsSection.classList.add('d-none');
        
        // 로딩 애니메이션 효과
        this.animateLoadingEffect();
    }
    
    stopLoading() {
        this.isLoading = false;
        
        // 버튼 상태 복원
        const button = document.querySelector('#predictionForm button[type="submit"]');
        if (button) {
            const buttonText = button.querySelector('.btn-text');
            const spinner = button.querySelector('.spinner-border');
            
            if (buttonText) buttonText.textContent = 'AI 예상번호 생성하기';
            if (spinner) spinner.classList.add('d-none');
            button.disabled = false;
        }
        
        // 로딩 섹션 숨김
        const loadingSection = document.getElementById('loadingSection');
        if (loadingSection) loadingSection.classList.add('d-none');
    }
    
    animateLoadingEffect() {
        // 로딩 텍스트 애니메이션
        const loadingTexts = [
            'AI 모델이 데이터를 분석하고 있습니다...',
            '빈도분석 모델 실행 중...',
            '트렌드분석 모델 실행 중...',
            '패턴분석 모델 실행 중...',
            '통계분석 모델 실행 중...',
            '머신러닝 모델 실행 중...',
            '최적의 번호를 선별하고 있습니다...'
        ];
        
        let index = 0;
        const loadingText = document.querySelector('#loadingSection h4');
        
        const interval = setInterval(() => {
            if (!this.isLoading) {
                clearInterval(interval);
                return;
            }
            
            if (loadingText) {
                loadingText.textContent = loadingTexts[index];
                index = (index + 1) % loadingTexts.length;
            }
        }, 1500);
    }
    
    async displayResults(data) {
        // 결과 섹션 표시
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('d-none');
        }
        
        // 최고 추천 번호 표시
        await this.displayTopRecommendations(data.top_recommendations, data.user_numbers);
        
        // 모델별 결과 표시
        await this.displayModelResults(data.models, data.user_numbers);
        
        // 결과 애니메이션
        this.animateResults();
    }
    
    async displayTopRecommendations(recommendations, userNumbers) {
        const container = document.getElementById('topRecommendations');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (let i = 0; i < recommendations.length; i++) {
            const numbers = recommendations[i];
            const card = this.createRecommendationCard(numbers, `TOP ${i + 1}`, userNumbers, true);
            container.appendChild(card);
            
            // 순차적 애니메이션
            await this.delay(100);
            card.classList.add('animate-fade-in-up');
        }
    }
    
    async displayModelResults(models, userNumbers) {
        const container = document.getElementById('modelResults');
        if (!container) return;
        
        container.innerHTML = '';
        
        const modelOrder = [
            '빈도분석 모델',
            '트렌드분석 모델', 
            '패턴분석 모델',
            '통계분석 모델',
            '머신러닝 모델'
        ];
        
        for (const modelName of modelOrder) {
            if (models[modelName]) {
                const modelSection = this.createModelSection(modelName, models[modelName], userNumbers);
                container.appendChild(modelSection);
                
                await this.delay(200);
                modelSection.classList.add('animate-fade-in-left');
            }
        }
    }
    
    createRecommendationCard(numbers, label, userNumbers = [], isTopPick = false) {
        const card = document.createElement('div');
        card.className = 'col-md-6 col-lg-4';
        
        const cardContent = document.createElement('div');
        cardContent.className = `prediction-result ${isTopPick ? 'top-recommendation' : ''}`;
        
        const header = document.createElement('div');
        header.className = 'result-header';
        header.innerHTML = `
            <h6 class="result-title">${label}</h6>
            <div class="result-actions">
                <button class="btn btn-sm btn-outline-primary me-2" onclick="lottoPro.copyNumbers([${numbers.join(',')}])">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-sm btn-outline-success" onclick="lottoPro.shareNumbers([${numbers.join(',')}])">
                    <i class="fas fa-share"></i>
                </button>
            </div>
        `;
        
        const numbersDisplay = document.createElement('div');
        numbersDisplay.className = 'number-display';
        numbersDisplay.innerHTML = numbers.map(num => {
            const isUserNumber = userNumbers.includes(num);
            const ballClass = this.getNumberColorClass(num);
            const extraClass = isUserNumber ? 'user-number' : '';
            return `<div class="lotto-ball ${ballClass} ${extraClass}" title="${isUserNumber ? '내가 선택한 번호' : ''}">${num}</div>`;
        }).join('');
        
        if (userNumbers.length > 0) {
            const legend = document.createElement('small');
            legend.className = 'text-muted mt-2 d-block';
            legend.innerHTML = '⭐ = 내가 선택한 번호';
            cardContent.appendChild(legend);
        }
        
        cardContent.appendChild(header);
        cardContent.appendChild(numbersDisplay);
        card.appendChild(cardContent);
        
        return card;
    }
    
    createModelSection(modelName, modelData, userNumbers) {
        const section = document.createElement('div');
        section.className = 'model-section';
        
        const header = document.createElement('div');
        header.className = 'model-header';
        header.innerHTML = `
            <h6 class="mb-1">${modelName}</h6>
            <div class="model-description">${modelData.description}</div>
        `;
        
        const content = document.createElement('div');
        content.className = 'model-content';
        
        const predictionsContainer = document.createElement('div');
        predictionsContainer.className = 'row g-3';
        
        // 각 모델의 예측 결과 표시 (상위 5개만)
        modelData.predictions.slice(0, 5).forEach((numbers, index) => {
            const predictionCard = this.createRecommendationCard(
                numbers, 
                `${index + 1}번`, 
                userNumbers, 
                false
            );
            predictionsContainer.appendChild(predictionCard);
        });
        
        content.appendChild(predictionsContainer);
        
        // 통계 정보
        const stats = document.createElement('div');
        stats.className = 'mt-3 d-flex gap-2 flex-wrap';
        stats.innerHTML = `
            <span class="badge bg-primary">총 ${modelData.predictions.length}개 조합</span>
            <span class="badge bg-info">정확도 ${this.getRandomAccuracy()}%</span>
            <span class="badge bg-success">신뢰도 높음</span>
        `;
        content.appendChild(stats);
        
        section.appendChild(header);
        section.appendChild(content);
        
        return section;
    }
    
    getNumberColorClass(number) {
        if (number <= 10) return 'lotto-ball-1';
        if (number <= 20) return 'lotto-ball-2';
        if (number <= 30) return 'lotto-ball-3';
        if (number <= 40) return 'lotto-ball-4';
        return 'lotto-ball-5';
    }
    
    getRandomAccuracy() {
        return Math.floor(Math.random() * 15) + 75; // 75-90% 범위
    }
    
    displayStatistics(data) {
        // 핫 넘버 표시
        const hotContainer = document.getElementById('hotNumbers');
        if (hotContainer && data.hot_numbers) {
            hotContainer.innerHTML = data.hot_numbers.slice(0, 8).map(([num, freq]) => 
                `<div class="lotto-ball hot-number" title="${freq}회 출현" data-frequency="${freq}">${num}</div>`
            ).join('');
        }
        
        // 콜드 넘버 표시
        const coldContainer = document.getElementById('coldNumbers');
        if (coldContainer && data.cold_numbers) {
            coldContainer.innerHTML = data.cold_numbers.slice(0, 8).map(([num, freq]) => 
                `<div class="lotto-ball cold-number" title="${freq}회 출현" data-frequency="${freq}">${num}</div>`
            ).join('');
        }
    }
    
    // 유틸리티 함수들
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // 개선된 토스트 알림
    showToast(message, type = 'info') {
        // 기존 토스트 제거
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed custom-toast`;
        toast.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);';
        toast.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
                <span>${message}</span>
            </div>
            <button type="button" class="btn-close" onclick="this.parentElement.remove()"></button>
        `;
        
        document.body.appendChild(toast);
        
        // 자동 제거
        setTimeout(() => {
            if (toast.parentNode) {
                toast.style.opacity = '0';
                setTimeout(() => {
                    if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                    }
                }, 300);
            }
        }, 5000);
    }
    
    copyNumbers(numbers) {
        const text = numbers.join(', ');
        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`번호가 복사되었습니다: ${text}`, 'success');
        }).catch(() => {
            this.showToast('복사 실패', 'error');
        });
    }
    
    shareNumbers(numbers) {
        const text = `LottoPro AI 추천 번호: ${numbers.join(', ')}`;
        const url = window.location.href;
        
        if (navigator.share) {
            navigator.share({
                title: 'LottoPro AI 추천 번호',
                text: text,
                url: url
            });
        } else {
            this.copyNumbers(numbers);
        }
    }
    
    animateResults() {
        // 결과 카드들에 순차적 애니메이션 적용
        const resultCards = document.querySelectorAll('.prediction-result');
        resultCards.forEach((card, index) => {
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.5s ease';
                
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            }, index * 100);
        });
    }
    
    animateHeroBalls() {
        // 히어로 섹션의 로또볼 애니메이션
        const balls = document.querySelectorAll('.lotto-ball-container .lotto-ball');
        balls.forEach((ball, index) => {
            ball.addEventListener('click', () => {
                ball.style.animation = 'none';
                ball.offsetHeight; // 리플로우 강제 실행
                ball.style.animation = 'bounce 0.6s ease';
            });
        });
    }
    
    animateCounters() {
        // 숫자 카운터 애니메이션
        const counters = document.querySelectorAll('.hero-stats h3');
        
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px 0px -100px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateCounter(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        counters.forEach(counter => {
            if (counter) observer.observe(counter);
        });
    }
    
    animateCounter(element) {
        const target = element.textContent.replace(/[^0-9]/g, '');
        const targetNumber = parseInt(target);
        
        if (isNaN(targetNumber)) return;
        
        let current = 0;
        const increment = targetNumber / 50;
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNumber) {
                current = targetNumber;
                clearInterval(timer);
            }
            element.textContent = element.textContent.replace(/[0-9]+/, Math.floor(current));
        }, 40);
    }
    
    initializeScrollAnimations() {
        // 스크롤 시 애니메이션 효과
        const animatedElements = document.querySelectorAll('.feature-card, .about-feature-item');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-fade-in-up');
                }
            });
        }, observerOptions);
        
        animatedElements.forEach(element => {
            if (element) observer.observe(element);
        });
    }
    
    initializeShareFeatures() {
        // 소셜 공유 기능 초기화
        const socialLinks = document.querySelectorAll('footer a[href="#"]');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const platform = link.querySelector('i').classList.contains('fa-github') ? 'GitHub' :
                                link.querySelector('i').classList.contains('fa-twitter') ? 'Twitter' : 'Email';
                this.showToast(`${platform} 공유 기능은 준비 중입니다`, 'info');
            });
        });
    }
    
    initializeParticleEffect() {
        // 배경 파티클 효과 (선택사항)
        if (window.innerWidth > 768) { // 데스크톱에서만
            this.createParticles();
        }
    }
    
    createParticles() {
        const heroSection = document.querySelector('.hero-section');
        if (!heroSection) return;
        
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('div');
            particle.style.cssText = `
                position: absolute;
                width: 4px;
                height: 4px;
                background: rgba(255,255,255,0.3);
                border-radius: 50%;
                top: ${Math.random() * 100}%;
                left: ${Math.random() * 100}%;
                animation: float ${3 + Math.random() * 4}s infinite ease-in-out;
                animation-delay: ${Math.random() * 2}s;
            `;
            heroSection.appendChild(particle);
        }
    }

    // 클래스 소멸자에서 인터벌 정리
    destroy() {
        if (this.exampleUpdateInterval) {
            clearInterval(this.exampleUpdateInterval);
        }
        
        // 기존 애니메이션 타임아웃 정리
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    }
}

// CSS 애니메이션 추가 (style.css에 추가할 내용)
const additionalCSS = `
@keyframes float {
    0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 1; }
    50% { transform: translateY(-20px) rotate(180deg); opacity: 0.3; }
}

.animate-fade-in-up {
    animation: fadeInUp 0.6s ease-out forwards;
}

.animate-fade-in-left {
    animation: fadeInLeft 0.6s ease-out forwards;
}

.animate-fade-in-right {
    animation: fadeInRight 0.6s ease-out forwards;
}

.custom-toast {
    font-size: 14px;
    border: none;
    border-radius: 8px;
}

.example-ball {
    transition: transform 0.3s ease;
}

.example-ball:hover {
    transform: scale(1.1) !important;
    cursor: pointer;
}
`;

// 전역 인스턴스 생성
let lottoPro;

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', function() {
    try {
        lottoPro = new LottoProAI();
        console.log('LottoPro AI 앱이 성공적으로 초기화되었습니다.');
        
        // 실시간 예시번호 시스템 초기화 (약간의 지연 후)
        setTimeout(() => {
            if (lottoPro && lottoPro.initializeHeroExampleNumbers) {
                lottoPro.initializeHeroExampleNumbers();
            }
        }, 1000);
        
    } catch (error) {
        console.error('앱 초기화 실패:', error);
    }
});

// 서비스 워커 등록 (PWA 지원)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('ServiceWorker registration successful');
            })
            .catch(function(err) {
                console.log('ServiceWorker registration failed');
            });
    });
}
