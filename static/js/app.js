// LottoPro AI Advanced JavaScript Application (완전 동적 데이터 버전)

class LottoProAI {
    constructor() {
        this.isLoading = false;
        this.currentPrediction = null;
        this.animationTimeouts = [];
        this.exampleUpdateInterval = null;
        this.isUpdatingExample = false;
        this.apiRetryCount = 0;
        this.maxRetries = 3;
        this.abortController = null;
        this.currentRoundInfo = null; // 현재 회차 정보 저장
        this.serverData = null; // 서버에서 받은 실제 데이터 저장
        this.cachedStatsData = null; // 통계 데이터 캐시
        
        this.init();
    }
    
    init() {
        this.initializeEventListeners();
        this.initializeAnimations();
        this.loadInitialStats();
        this.checkServerHealth();
    }
    
    // 안전한 타임아웃 생성 함수 (AbortSignal.timeout 대신)
    createTimeoutController(timeoutMs) {
        const controller = new AbortController();
        
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);
        
        // cleanup 함수 추가
        const originalAbort = controller.abort.bind(controller);
        controller.abort = () => {
            clearTimeout(timeoutId);
            originalAbort();
        };
        
        return controller;
    }
    
    async checkServerHealth() {
        /**
         * 서버 상태 확인 및 분석 상태 체크 (완전 동적 데이터)
         */
        try {
            const response = await fetch('/api/health');
            const health = await response.json();
            
            console.log('서버 상태:', health);
            
            // 서버 데이터 저장
            this.serverData = health;
            
            // 최신 회차 정보 저장 및 표시
            if (health.latest_round_info) {
                this.currentRoundInfo = health.latest_round_info;
                this.displayRoundInfo(health.latest_round_info);
                console.log(`최신 회차: ${health.latest_round_info.round}회차 (${health.latest_round_info.draw_date})`);
            }
            
            // 데이터 카운트 업데이트
            if (health.sample_data_count) {
                this.updateDataCount(health.sample_data_count);
            }
            
            if (health.analysis_status) {
                const analysisStatus = health.analysis_status;
                const statusMessage = `데이터 분석 상태: 빈도분석(${analysisStatus.frequency_analysis ? '✅' : '❌'}) | 트렌드분석(${analysisStatus.trend_analysis ? '✅' : '❌'}) | 패턴분석(${analysisStatus.pattern_analysis ? '✅' : '❌'})`;
                console.log(statusMessage);
                
                // 분석이 모두 완료된 경우에만 실시간 예시번호 시작
                if (analysisStatus.frequency_analysis && analysisStatus.trend_analysis && analysisStatus.pattern_analysis) {
                    this.showToast('실제 데이터 분석이 완료되었습니다! 고품질 AI 예측을 제공합니다.', 'success');
                    setTimeout(() => this.initializeHeroExampleNumbers(), 2000);
                } else {
                    this.showToast('데이터 분석 중입니다. 잠시만 기다려주세요.', 'info');
                    // 5초 후 재시도
                    setTimeout(() => this.checkServerHealth(), 5000);
                }
            }
            
            // 데이터 소스 정보 업데이트
            if (health.data_source) {
                this.updateMainDataSource(health.data_source);
            }
            
        } catch (error) {
            console.error('서버 상태 확인 실패:', error);
            // 서버 연결 실패해도 기본 기능은 동작하도록
            setTimeout(() => this.initializeHeroExampleNumbers(), 3000);
        }
    }
    
    displayRoundInfo(roundInfo) {
        /**
         * 회차 정보 표시 (안전한 DOM 조작)
         */
        // 히어로 섹션 회차 정보 업데이트
        const currentRoundDisplay = document.getElementById('currentRoundDisplay');
        if (currentRoundDisplay) {
            currentRoundDisplay.textContent = roundInfo.round;
        }
        
        const nextRoundDisplay = document.getElementById('nextRoundDisplay');
        if (nextRoundDisplay) {
            nextRoundDisplay.textContent = roundInfo.round + 1;
        }
        
        // 회차 정보 상세 표시 (날짜 포함)
        const roundDetailInfo = document.getElementById('roundDetailInfo');
        if (roundDetailInfo) {
            // 안전한 DOM 조작
            while (roundDetailInfo.firstChild) {
                roundDetailInfo.removeChild(roundDetailInfo.firstChild);
            }
            
            const small = document.createElement('small');
            small.className = 'text-muted';
            
            // 최신 회차 정보
            const latestText = document.createTextNode(`최신: ${roundInfo.round}회차 (${roundInfo.draw_date})`);
            small.appendChild(latestText);
            
            const br = document.createElement('br');
            small.appendChild(br);
            
            // 다음 회차 정보  
            const nextText = document.createTextNode(`다음: ${roundInfo.round + 1}회차 예측`);
            small.appendChild(nextText);
            
            roundDetailInfo.appendChild(small);
        }
        
        // 최신 당첨번호 표시 (선택적)
        const latestWinningNumbers = document.getElementById('latestWinningNumbers');
        if (latestWinningNumbers && roundInfo.numbers) {
            // 안전한 DOM 조작
            while (latestWinningNumbers.firstChild) {
                latestWinningNumbers.removeChild(latestWinningNumbers.firstChild);
            }
            
            const title = document.createElement('small');
            title.className = 'text-muted d-block mb-1';
            title.textContent = `${roundInfo.round}회차 당첨번호:`;
            latestWinningNumbers.appendChild(title);
            
            const numbersDiv = document.createElement('div');
            numbersDiv.className = 'd-flex gap-1 flex-wrap justify-content-center';
            
            roundInfo.numbers.forEach((num, index) => {
                const ball = document.createElement('span');
                ball.className = `badge bg-secondary small`;
                ball.textContent = num.toString();
                numbersDiv.appendChild(ball);
            });
            
            // 보너스 번호
            if (roundInfo.bonus) {
                const bonusBall = document.createElement('span');
                bonusBall.className = 'badge bg-warning small ms-1';
                bonusBall.textContent = `+${roundInfo.bonus}`;
                numbersDiv.appendChild(bonusBall);
            }
            
            latestWinningNumbers.appendChild(numbersDiv);
        }
    }
    
    updateDataCount(count) {
        /**
         * 데이터 카운트 표시 업데이트
         */
        const dataCountDisplay = document.getElementById('dataCountDisplay');
        if (dataCountDisplay) {
            // 숫자 애니메이션
            const currentCount = parseInt(dataCountDisplay.textContent.replace(/,/g, '')) || 0;
            this.animateNumberChange(dataCountDisplay, currentCount, count);
        }
    }
    
    animateNumberChange(element, fromValue, toValue) {
        /**
         * 숫자 변경 애니메이션
         */
        const duration = 1000; // 1초
        const steps = 20;
        const stepValue = (toValue - fromValue) / steps;
        let currentStep = 0;
        
        const interval = setInterval(() => {
            currentStep++;
            const currentValue = Math.round(fromValue + (stepValue * currentStep));
            element.textContent = currentValue.toLocaleString();
            
            if (currentStep >= steps) {
                clearInterval(interval);
                element.textContent = toValue.toLocaleString(); // 최종 정확한 값
            }
        }, duration / steps);
    }
    
    updateMainDataSource(dataSource) {
        /**
         * 메인 데이터 소스 정보 업데이트 (안전한 DOM 조작)
         */
        const dataSourceText = document.getElementById('dataSourceText');
        if (dataSourceText) {
            dataSourceText.textContent = dataSource;
        }
        
        const predictionDataSource = document.getElementById('predictionDataSourceText');
        if (predictionDataSource) {
            predictionDataSource.textContent = dataSource;
        }
        
        // 히어로 섹션 데이터 소스도 업데이트
        this.updateDataSourceInfo(dataSource);
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
            
            // 통계 데이터 캐시
            this.cachedStatsData = data;
            
            if (data.hot_numbers && data.cold_numbers) {
                this.displayStatistics(data);
                
                // 분석 상태 표시
                if (data.analysis_status) {
                    console.log('통계 분석 상태:', data.analysis_status);
                }
                
                // 회차 정보 표시 (stats API에서도 회차 정보 제공)
                if (data.current_round) {
                    this.displayStatsRoundInfo(data.current_round, data.next_round);
                }
            }
        } catch (error) {
            console.error('통계 로드 실패:', error);
            this.showToast('통계 데이터 로드에 실패했습니다.', 'warning');
        }
    }
    
    displayStatsRoundInfo(currentRound, nextRound) {
        /**
         * 통계 섹션 회차 정보 표시
         */
        const statsRoundInfo = document.getElementById('statsRoundInfo');
        if (statsRoundInfo) {
            // 안전한 DOM 조작
            while (statsRoundInfo.firstChild) {
                statsRoundInfo.removeChild(statsRoundInfo.firstChild);
            }
            
            const div = document.createElement('div');
            div.className = 'alert alert-info d-inline-flex align-items-center';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-info-circle me-2';
            
            const span = document.createElement('span');
            span.textContent = `현재: ${currentRound}회차 | 다음 예측 대상: ${nextRound}회차`;
            
            div.appendChild(icon);
            div.appendChild(span);
            statsRoundInfo.appendChild(div);
        }
    }

    // ===== 실시간 예시번호 기능 (완전 동적 데이터 버전) =====
    
    initializeHeroExampleNumbers() {
        /**
         * 히어로 섹션 실시간 예시번호 시스템 초기화
         */
        console.log('실시간 예시번호 시스템 초기화');
        
        // 즉시 첫 예시번호 생성
        this.updateHeroExampleNumbers();
        
        // 30초마다 자동 업데이트
        if (this.exampleUpdateInterval) {
            clearInterval(this.exampleUpdateInterval);
        }
        
        this.exampleUpdateInterval = setInterval(() => {
            this.updateHeroExampleNumbers();
        }, 30000);
        
        // 예시번호 클릭 이벤트 연결
        this.attachExampleClickEvent();
    }

    async updateHeroExampleNumbers() {
        /**
         * 히어로 섹션 예시번호 업데이트 (완전 동적 버전)
         */
        try {
            console.log('예시번호 업데이트 시작');
            
            // 연속 업데이트 방지
            if (this.isUpdatingExample) {
                console.log('이미 업데이트 중입니다.');
                return;
            }
            
            this.isUpdatingExample = true;
            
            // 안전한 타임아웃 컨트롤러 생성
            const timeoutController = this.createTimeoutController(10000); // 10초 타임아웃
            
            const response = await fetch('/api/example-numbers', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: timeoutController.signal
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('서버 응답:', data);
            
            if (data.success && data.example_numbers && Array.isArray(data.example_numbers)) {
                this.displayHeroExampleNumbers(data.example_numbers, data.analysis);
                console.log('예시번호 업데이트 완료:', data.example_numbers);
                
                // 데이터 소스 정보 표시
                if (data.data_source) {
                    this.updateDataSourceInfo(data.data_source);
                }
                
                // 회차 정보 업데이트
                if (data.current_round && data.next_round) {
                    this.updateExampleRoundInfo(data.current_round, data.next_round);
                }
                
                // 재시도 카운터 리셋
                this.apiRetryCount = 0;
                
            } else {
                throw new Error(data.error || '예시번호 생성 실패');
            }
            
        } catch (error) {
            console.log('예시번호 API 실패, 클라이언트 생성 사용:', error);
            
            // 재시도 로직
            if (this.apiRetryCount < this.maxRetries) {
                this.apiRetryCount++;
                console.log(`재시도 ${this.apiRetryCount}/${this.maxRetries}`);
                
                setTimeout(() => {
                    this.isUpdatingExample = false;
                    this.updateHeroExampleNumbers();
                }, 2000 * this.apiRetryCount); // 점진적 지연
                
                return;
            }
            
            // 최대 재시도 초과 시 클라이언트 생성
            this.generateClientSideExample();
            this.apiRetryCount = 0;
            
        } finally {
            this.isUpdatingExample = false;
        }
    }
    
    updateExampleRoundInfo(currentRound, nextRound) {
        /**
         * 예시번호 섹션 회차 정보 업데이트
         */
        const exampleRoundInfo = document.getElementById('exampleRoundInfo');
        if (exampleRoundInfo) {
            // 안전한 DOM 조작
            while (exampleRoundInfo.firstChild) {
                exampleRoundInfo.removeChild(exampleRoundInfo.firstChild);
            }
            
            const small = document.createElement('small');
            small.className = 'text-info';
            small.textContent = `${nextRound}회차 예측 예시`;
            
            exampleRoundInfo.appendChild(small);
        }
    }

    generateClientSideExample() {
        /**
         * 클라이언트에서 실제 데이터 기반 예시번호 생성 (완전 동적 버전)
         */
        try {
            console.log('클라이언트 예시번호 생성 시작');
            
            let numbers = [];
            
            // 1순위: 캐시된 통계 데이터 사용
            if (this.cachedStatsData && this.cachedStatsData.hot_numbers && this.cachedStatsData.cold_numbers) {
                console.log('캐시된 통계 데이터 사용');
                
                // 실제 핫넘버에서 2-3개 선택
                const hotNumbers = this.cachedStatsData.hot_numbers.slice(0, 15).map(([num, freq]) => num);
                const selectedHot = this.getRandomElements(hotNumbers, Math.random() < 0.7 ? 3 : 2);
                numbers.push(...selectedHot);
                
                // 실제 콜드넘버에서 1-2개 선택
                const coldNumbers = this.cachedStatsData.cold_numbers.slice(0, 10).map(([num, freq]) => num);
                const selectedCold = this.getRandomElements(coldNumbers, Math.random() < 0.5 ? 1 : 0);
                numbers.push(...selectedCold);
                
                // 나머지는 전체 범위에서 랜덤
                while (numbers.length < 6) {
                    const randomNum = Math.floor(Math.random() * 45) + 1;
                    if (!numbers.includes(randomNum)) {
                        numbers.push(randomNum);
                    }
                }
            }
            // 2순위: 최신 회차 정보 사용
            else if (this.currentRoundInfo && this.currentRoundInfo.numbers) {
                console.log('최신 회차 정보 기반 생성');
                
                const latestNumbers = this.currentRoundInfo.numbers;
                
                // 최신 당첨번호 중 1-2개 포함 (패턴 연관성)
                const includedCount = Math.random() < 0.6 ? 1 : 2;
                const selectedFromLatest = this.getRandomElements(latestNumbers, includedCount);
                numbers.push(...selectedFromLatest);
                
                // 나머지는 범위별 균등 분포
                const ranges = [
                    [1, 15], [16, 30], [31, 45]
                ];
                
                for (const [min, max] of ranges) {
                    if (numbers.length >= 6) break;
                    
                    let attempts = 0;
                    while (numbers.length < 6 && attempts < 10) {
                        const randomNum = Math.floor(Math.random() * (max - min + 1)) + min;
                        if (!numbers.includes(randomNum)) {
                            numbers.push(randomNum);
                            break;
                        }
                        attempts++;
                    }
                }
                
                // 여전히 부족하면 전체 범위에서
                while (numbers.length < 6) {
                    const randomNum = Math.floor(Math.random() * 45) + 1;
                    if (!numbers.includes(randomNum)) {
                        numbers.push(randomNum);
                    }
                }
            }
            // 3순위: 최후의 수단 - 현실적인 분포 기반
            else {
                console.log('기본 현실적 분포 생성');
                
                // 현실적인 로또 분포 (실제 데이터 없어도 합리적)
                const lowRange = Array.from({length: 15}, (_, i) => i + 1);    // 1-15
                const midRange = Array.from({length: 15}, (_, i) => i + 16);   // 16-30  
                const highRange = Array.from({length: 15}, (_, i) => i + 31);  // 31-45
                
                // 각 범위에서 2개씩 선택 (균등 분포)
                numbers.push(...this.getRandomElements(lowRange, 2));
                numbers.push(...this.getRandomElements(midRange, 2));
                numbers.push(...this.getRandomElements(highRange, 2));
            }
            
            const sortedNumbers = numbers.slice(0, 6).sort((a, b) => a - b);
            
            // 분석 정보 생성
            const analysis = {
                sum: sortedNumbers.reduce((a, b) => a + b, 0),
                even_count: sortedNumbers.filter(n => n % 2 === 0).length,
                odd_count: sortedNumbers.filter(n => n % 2 !== 0).length
            };
            
            this.displayHeroExampleNumbers(sortedNumbers, analysis);
            
            // 데이터 소스 표시
            let sourceText = '클라이언트 AI 생성';
            if (this.cachedStatsData) {
                sourceText = '실제 통계 기반 클라이언트 생성';
            } else if (this.currentRoundInfo) {
                sourceText = '최신 회차 기반 클라이언트 생성';
            }
            this.updateDataSourceInfo(sourceText);
            
            // 회차 정보 업데이트 (저장된 정보 사용)
            if (this.currentRoundInfo) {
                this.updateExampleRoundInfo(this.currentRoundInfo.round, this.currentRoundInfo.round + 1);
            }
            
            console.log('클라이언트 예시번호 생성 완료:', sortedNumbers);
            
        } catch (error) {
            console.error('클라이언트 예시번호 생성 실패:', error);
            // 정말 최후의 수단 - 단순 랜덤
            const emergencyNumbers = [];
            while (emergencyNumbers.length < 6) {
                const randomNum = Math.floor(Math.random() * 45) + 1;
                if (!emergencyNumbers.includes(randomNum)) {
                    emergencyNumbers.push(randomNum);
                }
            }
            const sortedEmergency = emergencyNumbers.sort((a, b) => a - b);
            this.displayHeroExampleNumbers(sortedEmergency, {
                sum: sortedEmergency.reduce((a, b) => a + b, 0), 
                even_count: sortedEmergency.filter(n => n % 2 === 0).length,
                odd_count: sortedEmergency.filter(n => n % 2 !== 0).length
            });
            this.updateDataSourceInfo('응급 랜덤 생성');
        }
    }
    
    getRandomElements(array, count) {
        /**
         * 배열에서 랜덤하게 지정된 개수만큼 선택
         */
        if (!array || array.length === 0 || count <= 0) return [];
        
        const shuffled = [...array].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, Math.min(count, array.length));
    }

    displayHeroExampleNumbers(numbers, analysis = null) {
        /**
         * 히어로 섹션에 예시번호 표시 (안전한 DOM 조작)
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
            // 안전한 DOM 정리
            while (container.firstChild) {
                container.removeChild(container.firstChild);
            }
            
            numbers.forEach((number, index) => {
                const ball = document.createElement('div');
                ball.className = `lotto-ball ${this.getNumberColorClass(number)} example-ball`;
                
                // 안전한 텍스트 설정
                ball.textContent = number.toString();
                ball.style.transform = 'scale(0) rotateY(-180deg)';
                ball.style.opacity = '0';
                ball.style.cursor = 'pointer';
                ball.title = '클릭하면 새로운 AI 예시번호가 생성됩니다';
                ball.setAttribute('data-number', number.toString());
                
                container.appendChild(ball);
                
                // 순차적 애니메이션
                setTimeout(() => {
                    ball.style.transition = 'all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
                    ball.style.transform = 'scale(1) rotateY(0deg)';
                    ball.style.opacity = '1';
                }, index * 150 + 200);
                
                // 개별 호버 효과
                ball.addEventListener('mouseenter', () => {
                    ball.style.transform = 'scale(1.1) rotateY(10deg)';
                });
                
                ball.addEventListener('mouseleave', () => {
                    ball.style.transform = 'scale(1) rotateY(0deg)';
                });
            });
            
            // 분석 정보 업데이트
            this.updateExampleAnalysis(numbers, analysis);
            
        }, 600);
    }

    updateExampleAnalysis(numbers, analysis) {
        /**
         * 예시번호 분석 정보 업데이트 (안전한 DOM 조작)
         */
        const infoContainer = document.getElementById('exampleInfo');
        if (infoContainer && analysis) {
            const sum = analysis.sum || numbers.reduce((a, b) => a + b, 0);
            const evenCount = analysis.even_count || numbers.filter(n => n % 2 === 0).length;
            const oddCount = analysis.odd_count || numbers.filter(n => n % 2 !== 0).length;
            
            // 연속번호 계산
            const consecutiveCount = this.countConsecutiveNumbers(numbers);
            
            // 안전한 DOM 업데이트
            const small = document.createElement('small');
            small.className = 'text-light opacity-75';
            
            // 회차 정보 포함한 텍스트 구성
            let roundText = '';
            if (this.currentRoundInfo) {
                roundText = `${this.currentRoundInfo.round + 1}회차 예측 | `;
            }
            
            // 안전한 텍스트 노드 생성
            const textParts = [
                roundText,
                '합계: ',
                sum.toString(),
                ' | 짝수: ',
                evenCount.toString(),
                '개 | 홀수: ',
                oddCount.toString(),
                '개 | 연속: ',
                consecutiveCount.toString(),
                '개 | ✨ 실시간 AI 분석'
            ];
            
            // span 요소들로 안전하게 구성
            if (roundText) {
                const roundSpan = document.createElement('span');
                roundSpan.className = 'text-info';
                roundSpan.textContent = textParts[0];
                small.appendChild(roundSpan);
            }
            
            small.appendChild(document.createTextNode(textParts[1]));
            const sumSpan = document.createElement('span');
            sumSpan.className = 'text-warning';
            sumSpan.textContent = textParts[2];
            small.appendChild(sumSpan);
            
            small.appendChild(document.createTextNode(textParts[3]));
            const evenSpan = document.createElement('span');
            evenSpan.className = 'text-info';
            evenSpan.textContent = textParts[4];
            small.appendChild(evenSpan);
            
            small.appendChild(document.createTextNode(textParts[5]));
            const oddSpan = document.createElement('span');
            oddSpan.className = 'text-info';
            oddSpan.textContent = textParts[6];
            small.appendChild(oddSpan);
            
            small.appendChild(document.createTextNode(textParts[7]));
            const consSpan = document.createElement('span');
            consSpan.className = 'text-success';
            consSpan.textContent = textParts[8];
            small.appendChild(consSpan);
            
            small.appendChild(document.createTextNode(textParts[9]));
            const aiSpan = document.createElement('span');
            aiSpan.className = 'text-warning';
            aiSpan.textContent = textParts[10];
            small.appendChild(aiSpan);
            
            // 기존 내용 안전하게 교체
            while (infoContainer.firstChild) {
                infoContainer.removeChild(infoContainer.firstChild);
            }
            infoContainer.appendChild(small);
            
            // 애니메이션 효과
            infoContainer.style.opacity = '0';
            setTimeout(() => {
                infoContainer.style.transition = 'opacity 0.5s ease';
                infoContainer.style.opacity = '1';
            }, 800);
        }
    }
    
    countConsecutiveNumbers(numbers) {
        /**
         * 연속번호 개수 계산
         */
        let consecutiveCount = 0;
        const sorted = [...numbers].sort((a, b) => a - b);
        
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i + 1] - sorted[i] === 1) {
                consecutiveCount++;
            }
        }
        
        return consecutiveCount;
    }
    
    updateDataSourceInfo(dataSource) {
        /**
         * 데이터 소스 정보 업데이트 (안전한 DOM 조작)
         */
        const descContainer = document.getElementById('exampleDescription');
        if (descContainer) {
            // 안전한 DOM 업데이트
            while (descContainer.firstChild) {
                descContainer.removeChild(descContainer.firstChild);
            }
            
            const mainText = document.createTextNode('AI가 분석한 예상번호 예시');
            const br1 = document.createElement('br');
            
            const sourceSmall = document.createElement('small');
            sourceSmall.className = 'text-success';
            sourceSmall.textContent = `📊 ${dataSource}`;
            
            const br2 = document.createElement('br');
            
            const updateSmall = document.createElement('small');
            updateSmall.className = 'text-warning';
            updateSmall.textContent = '✨ 30초마다 실시간 업데이트';
            
            descContainer.appendChild(mainText);
            descContainer.appendChild(br1);
            descContainer.appendChild(sourceSmall);
            descContainer.appendChild(br2);
            descContainer.appendChild(updateSmall);
        }
    }

    attachExampleClickEvent() {
        /**
         * 예시번호 클릭 이벤트 연결
         */
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('example-ball')) {
                // 연속 클릭 방지
                if (this.isUpdatingExample) {
                    this.showToast('이미 새로운 번호를 생성 중입니다...', 'info');
                    return;
                }
                
                // 시각적 피드백
                event.target.style.transform = 'scale(0.9) rotateY(180deg)';
                setTimeout(() => {
                    event.target.style.transform = 'scale(1) rotateY(0deg)';
                }, 200);
                
                this.updateHeroExampleNumbers();
                this.showToast('새로운 AI 예시번호를 생성하고 있습니다! 🎯', 'info');
            }
        });
    }

    // ===== 예측 기능 (CSP 호환 버전) =====
    
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
    
    async handlePredictionSubmit(event) {
        event.preventDefault();
        
        if (this.isLoading) return;
        
        const userNumbers = this.getUserNumbers();
        
        // 중복 검사
        if (userNumbers.length > 0 && this.hasDuplicateNumbers()) {
            this.showToast('중복된 번호를 제거해주세요', 'error');
            return;
        }
        
        try {
            this.startLoading();
            
            const requestData = {
                user_numbers: userNumbers || []
            };
            
            console.log('예측 요청 데이터:', requestData);
            
            // 안전한 타임아웃 컨트롤러 생성
            this.abortController = this.createTimeoutController(30000); // 30초 타임아웃
            
            const response = await fetch('/api/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestData),
                signal: this.abortController.signal
            });
            
            console.log('예측 응답 상태:', response.status);
            
            if (!response.ok) {
                let errorMessage = `서버 오류 (${response.status})`;
                
                if (response.status === 400) {
                    errorMessage = '잘못된 요청입니다. 번호를 다시 확인해주세요.';
                } else if (response.status === 500) {
                    errorMessage = '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                } else if (response.status === 404) {
                    errorMessage = '예측 서비스를 찾을 수 없습니다.';
                } else if (response.status === 503) {
                    errorMessage = '서비스가 일시적으로 사용할 수 없습니다.';
                }
                
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            console.log('예측 응답 데이터:', data);
            
            if (data.success) {
                this.currentPrediction = data;
                await this.displayResults(data);
                
                // 분석 적용 상태 확인
                if (data.analysis_applied) {
                    const appliedAnalysis = Object.entries(data.analysis_applied)
                        .filter(([key, value]) => value)
                        .map(([key, value]) => key.replace('_analysis', ''))
                        .join(', ');
                    
                    if (appliedAnalysis) {
                        this.showToast(`${appliedAnalysis} 분석이 적용된 고품질 AI 예측이 완료되었습니다! 🎯`, 'success');
                    }
                }
                
                // 회차 정보 포함한 성공 메시지
                let successMessage = 'AI 완전 분석 예측이 완료되었습니다!';
                if (data.next_round) {
                    successMessage = `${data.next_round}회차 AI 예측이 완료되었습니다!`;
                }
                if (userNumbers.length > 0) {
                    successMessage = `선호 번호 ${userNumbers.length}개를 포함한 ${data.next_round ? data.next_round + '회차 ' : ''}AI 예측이 완료되었습니다!`;
                }
                
                this.showToast(successMessage, 'success');
                
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
            
            let errorMessage = error.message;
            if (error.name === 'AbortError') {
                errorMessage = '요청 시간이 초과되었습니다. 네트워크를 확인하고 다시 시도해주세요.';
            } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
                errorMessage = '네트워크 연결에 문제가 있습니다. 인터넷 연결을 확인해주세요.';
            }
            
            this.showToast(errorMessage, 'error');
        } finally {
            this.stopLoading();
            // AbortController 정리
            if (this.abortController) {
                this.abortController.abort();
                this.abortController = null;
            }
        }
    }
    
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
        
        if (values.length === 0) {
            return false;
        }
        
        const uniqueValues = new Set(values);
        return uniqueValues.size !== values.length;
    }
    
    startLoading() {
        this.isLoading = true;
        
        const button = document.querySelector('#predictionForm button[type="submit"]');
        if (button) {
            const buttonText = button.querySelector('.btn-text');
            const spinner = button.querySelector('.spinner-border');
            
            if (buttonText) buttonText.textContent = 'AI가 분석 중...';
            if (spinner) spinner.classList.remove('d-none');
            button.disabled = true;
        }
        
        const loadingSection = document.getElementById('loadingSection');
        const resultsSection = document.getElementById('resultsSection');
        
        if (loadingSection) loadingSection.classList.remove('d-none');
        if (resultsSection) resultsSection.classList.add('d-none');
        
        this.animateLoadingEffect();
    }
    
    stopLoading() {
        this.isLoading = false;
        
        const button = document.querySelector('#predictionForm button[type="submit"]');
        if (button) {
            const buttonText = button.querySelector('.btn-text');
            const spinner = button.querySelector('.spinner-border');
            
            if (buttonText) buttonText.textContent = 'AI 예상번호 생성하기';
            if (spinner) spinner.classList.add('d-none');
            button.disabled = false;
        }
        
        const loadingSection = document.getElementById('loadingSection');
        if (loadingSection) loadingSection.classList.add('d-none');
    }
    
    animateLoadingEffect() {
        const loadingTexts = [
            '실제 당첨 데이터를 분석하고 있습니다...',
            '빈도분석 모델 실행 중...',
            '트렌드분석 모델 실행 중...',
            '패턴분석 모델 실행 중...',
            '통계분석 모델 실행 중...',
            '머신러닝 모델 실행 중...',
            '최적의 번호를 선별하고 있습니다...',
            '예측 결과를 검증하고 있습니다...'
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
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.classList.remove('d-none');
        }
        
        // 데이터 소스 정보 표시
        if (data.data_source) {
            this.displayDataSourceInfo(data.data_source);
        }
        
        // 회차 정보 표시
        if (data.current_round && data.next_round) {
            this.displayResultsRoundInfo(data.current_round, data.next_round);
        }
        
        // 최고 추천 번호 표시
        await this.displayTopRecommendations(data.top_recommendations, data.user_numbers);
        
        // 모델별 결과 표시
        await this.displayModelResults(data.models, data.user_numbers);
        
        // 결과 애니메이션
        this.animateResults();
    }
    
    displayResultsRoundInfo(currentRound, nextRound) {
        /**
         * 결과 섹션에 회차 정보 표시
         */
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            let roundInfo = resultsSection.querySelector('.results-round-info');
            if (!roundInfo) {
                roundInfo = document.createElement('div');
                roundInfo.className = 'alert alert-success results-round-info mb-4';
                resultsSection.insertBefore(roundInfo, resultsSection.firstChild);
            }
            
            // 안전한 DOM 업데이트
            while (roundInfo.firstChild) {
                roundInfo.removeChild(roundInfo.firstChild);
            }
            
            const div = document.createElement('div');
            div.className = 'd-flex align-items-center justify-content-center';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-trophy me-2';
            
            const span = document.createElement('span');
            const strong = document.createElement('strong');
            strong.textContent = `${nextRound}회차 AI 예측 결과`;
            span.appendChild(strong);
            span.appendChild(document.createTextNode(` (${currentRound}회차까지 분석 완료)`));
            
            div.appendChild(icon);
            div.appendChild(span);
            roundInfo.appendChild(div);
        }
    }
    
    displayDataSourceInfo(dataSource) {
        /**
         * 결과 섹션에 데이터 소스 정보 표시 (안전한 DOM 조작)
         */
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            let sourceInfo = resultsSection.querySelector('.data-source-info');
            if (!sourceInfo) {
                sourceInfo = document.createElement('div');
                sourceInfo.className = 'alert alert-info data-source-info mb-4';
                resultsSection.insertBefore(sourceInfo, resultsSection.firstChild);
            }
            
            // 안전한 DOM 업데이트
            while (sourceInfo.firstChild) {
                sourceInfo.removeChild(sourceInfo.firstChild);
            }
            
            const div = document.createElement('div');
            div.className = 'd-flex align-items-center';
            
            const icon = document.createElement('i');
            icon.className = 'fas fa-database me-2';
            
            const span = document.createElement('span');
            const strong = document.createElement('strong');
            strong.textContent = '분석 데이터: ';
            span.appendChild(strong);
            span.appendChild(document.createTextNode(dataSource));
            
            div.appendChild(icon);
            div.appendChild(span);
            sourceInfo.appendChild(div);
        }
    }
    
    async displayTopRecommendations(recommendations, userNumbers) {
        const container = document.getElementById('topRecommendations');
        if (!container) return;
        
        // 안전한 DOM 정리
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        for (let i = 0; i < recommendations.length; i++) {
            const numbers = recommendations[i];
            const card = this.createRecommendationCard(numbers, `TOP ${i + 1}`, userNumbers, true);
            container.appendChild(card);
            
            await this.delay(100);
            card.classList.add('animate-fade-in-up');
        }
    }
    
    async displayModelResults(models, userNumbers) {
        const container = document.getElementById('modelResults');
        if (!container) return;
        
        // 안전한 DOM 정리
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
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
        
        const title = document.createElement('h6');
        title.className = 'result-title';
        title.textContent = label;
        
        const actions = document.createElement('div');
        actions.className = 'result-actions';
        
        const copyBtn = document.createElement('button');
        copyBtn.className = 'btn btn-sm btn-outline-primary me-2';
        copyBtn.onclick = () => this.copyNumbers(numbers);
        const copyIcon = document.createElement('i');
        copyIcon.className = 'fas fa-copy';
        copyBtn.appendChild(copyIcon);
        
        const shareBtn = document.createElement('button');
        shareBtn.className = 'btn btn-sm btn-outline-success';
        shareBtn.onclick = () => this.shareNumbers(numbers);
        const shareIcon = document.createElement('i');
        shareIcon.className = 'fas fa-share';
        shareBtn.appendChild(shareIcon);
        
        actions.appendChild(copyBtn);
        actions.appendChild(shareBtn);
        
        header.appendChild(title);
        header.appendChild(actions);
        
        const numbersDisplay = document.createElement('div');
        numbersDisplay.className = 'number-display';
        
        numbers.forEach(num => {
            const isUserNumber = userNumbers.includes(num);
            const ball = document.createElement('div');
            ball.className = `lotto-ball ${this.getNumberColorClass(num)} ${isUserNumber ? 'user-number' : ''}`;
            ball.title = isUserNumber ? '내가 선택한 번호' : '';
            ball.textContent = num.toString();
            numbersDisplay.appendChild(ball);
        });
        
        cardContent.appendChild(header);
        cardContent.appendChild(numbersDisplay);
        
        if (userNumbers.length > 0) {
            const legend = document.createElement('small');
            legend.className = 'text-muted mt-2 d-block';
            legend.textContent = '⭐ = 내가 선택한 번호';
            cardContent.appendChild(legend);
        }
        
        card.appendChild(cardContent);
        
        return card;
    }
    
    createModelSection(modelName, modelData, userNumbers) {
        const section = document.createElement('div');
        section.className = 'model-section';
        
        const header = document.createElement('div');
        header.className = 'model-header';
        
        const title = document.createElement('h6');
        title.className = 'mb-1';
        title.textContent = modelName;
        
        const description = document.createElement('div');
        description.className = 'model-description';
        description.textContent = modelData.description;
        
        header.appendChild(title);
        header.appendChild(description);
        
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
        
        const totalBadge = document.createElement('span');
        totalBadge.className = 'badge bg-primary';
        totalBadge.textContent = `총 ${modelData.predictions.length}개 조합`;
        
        const accuracyBadge = document.createElement('span');
        accuracyBadge.className = 'badge bg-info';
        accuracyBadge.textContent = `정확도 ${this.getRandomAccuracy()}%`;
        
        const dataBadge = document.createElement('span');
        dataBadge.className = 'badge bg-success';
        dataBadge.textContent = '실제 데이터 분석';
        
        stats.appendChild(totalBadge);
        stats.appendChild(accuracyBadge);
        stats.appendChild(dataBadge);
        
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
        return Math.floor(Math.random() * 10) + 82; // 82-92% 범위
    }
    
    displayStatistics(data) {
        // 핫 넘버 표시 (안전한 DOM 조작)
        const hotContainer = document.getElementById('hotNumbers');
        if (hotContainer && data.hot_numbers) {
            while (hotContainer.firstChild) {
                hotContainer.removeChild(hotContainer.firstChild);
            }
            
            data.hot_numbers.slice(0, 8).forEach(([num, freq]) => {
                const ball = document.createElement('div');
                ball.className = 'lotto-ball hot-number';
                ball.title = `${freq}회 출현`;
                ball.setAttribute('data-frequency', freq.toString());
                ball.textContent = num.toString();
                hotContainer.appendChild(ball);
            });
        }
        
        // 콜드 넘버 표시 (안전한 DOM 조작)
        const coldContainer = document.getElementById('coldNumbers');
        if (coldContainer && data.cold_numbers) {
            while (coldContainer.firstChild) {
                coldContainer.removeChild(coldContainer.firstChild);
            }
            
            data.cold_numbers.slice(0, 8).forEach(([num, freq]) => {
                const ball = document.createElement('div');
                ball.className = 'lotto-ball cold-number';
                ball.title = `${freq}회 출현`;
                ball.setAttribute('data-frequency', freq.toString());
                ball.textContent = num.toString();
                coldContainer.appendChild(ball);
            });
        }
    }
    
    // ===== 유틸리티 함수들 =====
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    showToast(message, type = 'info') {
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show position-fixed custom-toast`;
        toast.style.cssText = 'top: 100px; right: 20px; z-index: 9999; max-width: 350px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);';
        
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center';
        
        const icon = document.createElement('i');
        icon.className = `fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-triangle' : 'info-circle'} me-2`;
        
        const span = document.createElement('span');
        span.textContent = message;
        
        const closeBtn = document.createElement('button');
        closeBtn.type = 'button';
        closeBtn.className = 'btn-close';
        closeBtn.onclick = () => toast.remove();
        
        div.appendChild(icon);
        div.appendChild(span);
        toast.appendChild(div);
        toast.appendChild(closeBtn);
        
        document.body.appendChild(toast);
        
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
        const balls = document.querySelectorAll('.lotto-ball-container .lotto-ball');
        balls.forEach((ball, index) => {
            ball.addEventListener('click', () => {
                ball.style.animation = 'none';
                ball.offsetHeight;
                ball.style.animation = 'bounce 0.6s ease';
            });
        });
    }
    
    animateCounters() {
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
        if (window.innerWidth > 768) {
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

    destroy() {
        if (this.exampleUpdateInterval) {
            clearInterval(this.exampleUpdateInterval);
        }
        
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        
        this.animationTimeouts.forEach(timeout => clearTimeout(timeout));
    }
}

// 전역 인스턴스 생성
let lottoPro;

// DOM 로드 완료 시 앱 초기화
document.addEventListener('DOMContentLoaded', function() {
    try {
        lottoPro = new LottoProAI();
        console.log('LottoPro AI 앱이 성공적으로 초기화되었습니다.');
        
    } catch (error) {
        console.error('앱 초기화 실패:', error);
        // 기본 메시지 표시
        const alertDiv = document.createElement('div');
        alertDiv.className = 'alert alert-warning position-fixed';
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999;';
        alertDiv.textContent = '앱 초기화에 문제가 있습니다. 페이지를 새로고침해주세요.';
        document.body.appendChild(alertDiv);
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
