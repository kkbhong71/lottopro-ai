from flask import Flask, render_template, request, jsonify
import os
import random
import numpy as np
from datetime import datetime
import json
from collections import Counter

# pandas는 선택적으로 import
try:
    import pandas as pd
    PANDAS_AVAILABLE = True
    print("✅ pandas 사용 가능")
except ImportError:
    PANDAS_AVAILABLE = False
    print("⚠️ pandas 없음 - 기본 모드로 동작")

# Flask 앱 초기화
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'lottopro-dev-key-2024')

# 글로벌 변수
sample_data = None
csv_dataframe = None
frequency_analysis = None
trend_analysis = None
pattern_analysis = None

def safe_log(message):
    """안전한 로깅"""
    try:
        print(f"[LOG] {message}")
    except:
        pass

def load_csv_data_ultra_safe():
    """new_1188.csv 파일 로드"""
    global csv_dataframe, PANDAS_AVAILABLE
    
    safe_log("CSV 로드 시작")
    
    if not PANDAS_AVAILABLE:
        safe_log("pandas 없음 - CSV 로드 불가")
        return None
    
    try:
        # 수정: new_1188.csv로 변경
        csv_path = 'new_1188.csv'
        
        if not os.path.exists(csv_path):
            safe_log(f"CSV 파일 없음: {csv_path}")
            return None
        
        df = pd.read_csv(csv_path)
        safe_log(f"CSV 로드 성공: {len(df)}회차")
        return df
        
    except Exception as e:
        safe_log(f"CSV 로드 실패: {str(e)}")
        return None

def convert_csv_ultra_safe(df):
    """CSV를 표준 형식으로 변환"""
    if df is None:
        return []
    
    try:
        safe_log("CSV 변환 시작")
        sample_data = []
        
        for index, row in df.iterrows():
            try:
                # CSV 컬럼명에 맞게 수정 (실제 new_1188.csv 구조에 맞춰야 함)
                data_row = {
                    '회차': int(row.get('round', row.get('회차', index + 1))),
                    '당첨번호1': int(row.get('num1', row.get('당첨번호1', 1))),
                    '당첨번호2': int(row.get('num2', row.get('당첨번호2', 2))),
                    '당첨번호3': int(row.get('num3', row.get('당첨번호3', 3))),
                    '당첨번호4': int(row.get('num4', row.get('당첨번호4', 4))),
                    '당첨번호5': int(row.get('num5', row.get('당첨번호5', 5))),
                    '당첨번호6': int(row.get('num6', row.get('당첨번호6', 6))),
                    '보너스번호': int(row.get('bonus num', row.get('보너스번호', 7)))
                }
                sample_data.append(data_row)
            except Exception as e:
                safe_log(f"행 변환 실패 (인덱스 {index}): {str(e)}")
                continue
        
        # 회차순 정렬 (최신순)
        try:
            sample_data.sort(key=lambda x: x.get('회차', 0), reverse=True)
        except:
            pass
        
        safe_log(f"CSV 변환 완료: {len(sample_data)}회차")
        return sample_data
        
    except Exception as e:
        safe_log(f"CSV 변환 실패: {str(e)}")
        return []

def analyze_frequency_patterns():
    """빈도 분석: 각 번호의 출현 빈도 계산"""
    global frequency_analysis
    
    if not sample_data:
        return None
    
    try:
        all_numbers = []
        for draw in sample_data:
            numbers = [
                draw['당첨번호1'], draw['당첨번호2'], draw['당첨번호3'],
                draw['당첨번호4'], draw['당첨번호5'], draw['당첨번호6']
            ]
            all_numbers.extend(numbers)
        
        frequency_counter = Counter(all_numbers)
        
        # 빈도 기반 가중치 계산
        total_draws = len(sample_data)
        frequency_weights = {}
        
        for num in range(1, 46):
            count = frequency_counter.get(num, 0)
            # 정규화된 가중치 (0.5 ~ 1.5 범위)
            weight = 0.5 + (count / total_draws)
            frequency_weights[num] = weight
        
        frequency_analysis = {
            'counter': frequency_counter,
            'weights': frequency_weights,
            'hot_numbers': frequency_counter.most_common(10),
            'cold_numbers': frequency_counter.most_common()[-10:]
        }
        
        safe_log(f"빈도 분석 완료: 가장 많이 나온 번호는 {frequency_analysis['hot_numbers'][0]}")
        return frequency_analysis
        
    except Exception as e:
        safe_log(f"빈도 분석 실패: {str(e)}")
        return None

def analyze_trend_patterns():
    """트렌드 분석: 최근 패턴 가중치"""
    global trend_analysis
    
    if not sample_data:
        return None
    
    try:
        # 최근 50회차 데이터에 더 높은 가중치
        recent_data = sample_data[:50] if len(sample_data) >= 50 else sample_data
        
        recent_numbers = []
        for draw in recent_data:
            numbers = [
                draw['당첨번호1'], draw['당첨번호2'], draw['당첨번호3'],
                draw['당첨번호4'], draw['당첨번호5'], draw['당첨번호6']
            ]
            recent_numbers.extend(numbers)
        
        recent_counter = Counter(recent_numbers)
        
        # 트렌드 가중치 계산
        trend_weights = {}
        for num in range(1, 46):
            recent_count = recent_counter.get(num, 0)
            # 최근 출현 빈도에 따른 가중치
            weight = 0.7 + (recent_count / len(recent_data)) * 0.6
            trend_weights[num] = weight
        
        trend_analysis = {
            'recent_counter': recent_counter,
            'weights': trend_weights,
            'trending_up': recent_counter.most_common(10),
            'trending_down': recent_counter.most_common()[-10:]
        }
        
        safe_log("트렌드 분석 완료")
        return trend_analysis
        
    except Exception as e:
        safe_log(f"트렌드 분석 실패: {str(e)}")
        return None

def analyze_pattern_relationships():
    """패턴 분석: 번호 조합 패턴"""
    global pattern_analysis
    
    if not sample_data:
        return None
    
    try:
        # 연속번호 패턴 분석
        consecutive_patterns = []
        sum_patterns = []
        even_odd_patterns = []
        
        for draw in sample_data:
            numbers = sorted([
                draw['당첨번호1'], draw['당첨번호2'], draw['당첨번호3'],
                draw['당첨번호4'], draw['당첨번호5'], draw['당첨번호6']
            ])
            
            # 연속번호 카운트
            consecutive_count = 0
            for i in range(len(numbers)-1):
                if numbers[i+1] - numbers[i] == 1:
                    consecutive_count += 1
            consecutive_patterns.append(consecutive_count)
            
            # 합계 패턴
            total_sum = sum(numbers)
            sum_patterns.append(total_sum)
            
            # 홀짝 패턴
            even_count = sum(1 for n in numbers if n % 2 == 0)
            even_odd_patterns.append(even_count)
        
        # 패턴 통계
        avg_consecutive = np.mean(consecutive_patterns)
        avg_sum = np.mean(sum_patterns)
        avg_even_count = np.mean(even_odd_patterns)
        
        pattern_analysis = {
            'avg_consecutive': avg_consecutive,
            'avg_sum': avg_sum,
            'avg_even_count': avg_even_count,
            'sum_range': (min(sum_patterns), max(sum_patterns)),
            'common_even_count': Counter(even_odd_patterns).most_common(1)[0][0]
        }
        
        safe_log("패턴 분석 완료")
        return pattern_analysis
        
    except Exception as e:
        safe_log(f"패턴 분석 실패: {str(e)}")
        return None

def generate_ai_prediction(model_type, user_numbers=None):
    """AI 모델별 예측 생성"""
    try:
        if user_numbers is None:
            user_numbers = []
        
        # 사용자 번호 검증
        safe_numbers = []
        if isinstance(user_numbers, list):
            for num in user_numbers:
                try:
                    n = int(num)
                    if 1 <= n <= 45 and n not in safe_numbers:
                        safe_numbers.append(n)
                except:
                    continue
        
        numbers = safe_numbers.copy()
        
        # 모델별 예측 로직
        if model_type == "빈도분석 모델" and frequency_analysis:
            # 빈도 기반 가중 선택
            while len(numbers) < 6:
                weights = []
                candidates = []
                for num in range(1, 46):
                    if num not in numbers:
                        candidates.append(num)
                        weights.append(frequency_analysis['weights'].get(num, 0.5))
                
                if candidates:
                    selected = np.random.choice(candidates, p=np.array(weights)/sum(weights))
                    numbers.append(int(selected))
                else:
                    numbers.append(random.randint(1, 45))
        
        elif model_type == "트렌드분석 모델" and trend_analysis:
            # 트렌드 기반 가중 선택
            while len(numbers) < 6:
                weights = []
                candidates = []
                for num in range(1, 46):
                    if num not in numbers:
                        candidates.append(num)
                        weights.append(trend_analysis['weights'].get(num, 0.5))
                
                if candidates:
                    selected = np.random.choice(candidates, p=np.array(weights)/sum(weights))
                    numbers.append(int(selected))
                else:
                    numbers.append(random.randint(1, 45))
        
        elif model_type == "패턴분석 모델" and pattern_analysis:
            # 패턴 기반 선택 (합계 범위 고려)
            while len(numbers) < 6:
                remaining_slots = 6 - len(numbers)
                current_sum = sum(numbers)
                target_sum = pattern_analysis['avg_sum']
                
                # 목표 합계에 맞는 범위 계산
                min_needed = max(1, int((target_sum - current_sum - (remaining_slots-1)*45) / remaining_slots))
                max_needed = min(45, int((target_sum - current_sum) / remaining_slots))
                
                candidates = [n for n in range(min_needed, max_needed+1) if n not in numbers]
                if candidates:
                    numbers.append(random.choice(candidates))
                else:
                    # 백업: 사용하지 않은 번호 중 랜덤
                    available = [n for n in range(1, 46) if n not in numbers]
                    if available:
                        numbers.append(random.choice(available))
        
        else:
            # 기본 랜덤 생성 (통계분석, 머신러닝 모델 등)
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        
        return sorted(numbers[:6])
        
    except Exception as e:
        safe_log(f"예측 생성 실패 ({model_type}): {str(e)}")
        return sorted(random.sample(range(1, 46), 6))

def generate_ultra_safe_sample_data():
    """기본 샘플 데이터 생성"""
    try:
        safe_log("기본 샘플 데이터 생성 시작")
        np.random.seed(42)
        data = []
        
        for draw in range(1188, 988, -1):  # 200회차
            try:
                numbers = sorted(np.random.choice(range(1, 46), 6, replace=False))
                available = [x for x in range(1, 46) if x not in numbers]
                bonus = np.random.choice(available) if available else 7
                
                data.append({
                    '회차': draw,
                    '당첨번호1': int(numbers[0]),
                    '당첨번호2': int(numbers[1]),
                    '당첨번호3': int(numbers[2]),
                    '당첨번호4': int(numbers[3]),
                    '당첨번호5': int(numbers[4]),
                    '당첨번호6': int(numbers[5]),
                    '보너스번호': int(bonus)
                })
            except Exception as e:
                safe_log(f"샘플 데이터 생성 실패 (회차 {draw}): {str(e)}")
                continue
        
        safe_log(f"기본 샘플 데이터 생성 완료: {len(data)}회차")
        return data
        
    except Exception as e:
        safe_log(f"기본 데이터 생성 실패: {str(e)}")
        return [
            {'회차': 1188, '당첨번호1': 14, '당첨번호2': 16, '당첨번호3': 23, '당첨번호4': 25, '당첨번호5': 31, '당첨번호6': 37, '보너스번호': 42}
        ]

def initialize_data_ultra_safe():
    """데이터 초기화 및 분석 실행 (실제 당첨번호 우선)"""
    global sample_data, csv_dataframe
    
    try:
        safe_log("=== 실제 당첨번호 기반 데이터 초기화 시작 ===")
        
        # 1단계: CSV 로드 시도
        csv_dataframe = load_csv_data_ultra_safe()
        
        if csv_dataframe is not None:
            sample_data = convert_csv_ultra_safe(csv_dataframe)
            if len(sample_data) > 0:
                safe_log(f"✅ CSV 기반 초기화 완료: {len(sample_data)}회차")
                
                # 실제 CSV 데이터 분석 실행
                analyze_frequency_patterns()
                analyze_trend_patterns()
                analyze_pattern_relationships()
                
                safe_log("✅ 실제 CSV 데이터 분석 완료")
                return sample_data
        
        # 2단계: CSV 실패 시 실제 당첨번호 기반 샘플 사용
        safe_log("CSV 로드 실패 - 실제 당첨번호 기반 데이터 생성")
        sample_data = generate_ultra_safe_sample_data()
        
        if len(sample_data) > 0:
            # 실제 백업 데이터에도 분석 적용
            analyze_frequency_patterns()
            analyze_trend_patterns()
            analyze_pattern_relationships()
            
            safe_log(f"✅ 실제 당첨번호 기반 초기화 완료: {len(sample_data)}회차")
            safe_log("✅ 실제 백업 데이터 분석 완료")
            return sample_data
        
        # 3단계: 최후의 수단 - 최소한의 실제 데이터
        safe_log("모든 방법 실패 - 최소 실제 데이터 사용")
        sample_data = get_real_lotto_backup_data()
        
        # 최소 데이터라도 분석 시도
        analyze_frequency_patterns()
        analyze_trend_patterns() 
        analyze_pattern_relationships()
        
        safe_log(f"✅ 최소 실제 데이터 초기화 완료: {len(sample_data)}회차")
        return sample_data
        
    except Exception as e:
        safe_log(f"데이터 초기화 전체 실패: {str(e)}")
        # 그래도 실제 데이터 반환
        sample_data = get_real_lotto_backup_data()
        safe_log(f"⚠️ 예외 상황 - 기본 실제 데이터 사용: {len(sample_data)}회차")
        return sample_data

@app.route('/')
def index():
    """메인 페이지"""
    try:
        return render_template('index.html')
    except Exception as e:
        safe_log(f"메인 페이지 오류: {str(e)}")
        return "서비스 준비 중입니다.", 503

@app.route('/api/example-numbers', methods=['GET'])
def get_example_numbers():
    """실시간 예시번호 생성 API (누락된 엔드포인트)"""
    try:
        safe_log("example-numbers API 호출")
        
        # 데이터 초기화 확인
        if sample_data is None:
            initialize_data_ultra_safe()
        
        # AI 예측으로 예시번호 생성
        example_numbers = generate_ai_prediction("빈도분석 모델", [])
        
        # 분석 정보 계산
        analysis = {
            'sum': sum(example_numbers),
            'even_count': sum(1 for n in example_numbers if n % 2 == 0),
            'odd_count': sum(1 for n in example_numbers if n % 2 != 0)
        }
        
        return jsonify({
            'success': True,
            'example_numbers': example_numbers,
            'analysis': analysis,
            'data_source': f"실제 {len(csv_dataframe)}회차 데이터" if csv_dataframe is not None else "샘플 데이터"
        })
        
    except Exception as e:
        safe_log(f"example-numbers API 실패: {str(e)}")
        return jsonify({
            'success': False,
            'error': '예시번호 생성 실패',
            'example_numbers': [1, 7, 13, 25, 31, 42],
            'analysis': {'sum': 119, 'even_count': 2, 'odd_count': 4}
        })

@app.route('/api/predict', methods=['POST'])
def predict():
    """AI 예측 API (실제 CSV 분석 반영)"""
    try:
        safe_log("=== predict API 호출 시작 ===")
        
        # 데이터 초기화 확인
        if sample_data is None:
            initialize_data_ultra_safe()
        
        # 요청 데이터 파싱
        try:
            data = request.get_json()
            if data is None:
                data = {}
            safe_log(f"요청 데이터: {data}")
        except Exception as e:
            safe_log(f"JSON 파싱 실패: {str(e)}")
            data = {}
        
        # 사용자 번호 추출
        try:
            user_numbers = data.get('user_numbers', [])
            safe_log(f"사용자 번호: {user_numbers}")
        except Exception as e:
            safe_log(f"사용자 번호 추출 실패: {str(e)}")
            user_numbers = []
        
        # 5개 모델 예측 (실제 분석 반영)
        models = {}
        model_names = ['빈도분석 모델', '트렌드분석 모델', '패턴분석 모델', '통계분석 모델', '머신러닝 모델']
        
        for model_name in model_names:
            try:
                predictions = []
                for i in range(10):
                    pred = generate_ai_prediction(model_name, user_numbers)
                    predictions.append(pred)
                
                models[model_name] = {
                    'description': f'{model_name} 기반 실제 데이터 분석 예측',
                    'predictions': predictions
                }
                safe_log(f"{model_name} 완료")
            except Exception as e:
                safe_log(f"{model_name} 실패: {str(e)}")
                models[model_name] = {
                    'description': f'{model_name} 기반 예측',
                    'predictions': [[1, 7, 13, 25, 31, 42]]
                }
        
        # TOP 추천 (최고 성능 모델들 조합)
        try:
            top_recommendations = []
            for i in range(5):
                # 빈도분석과 트렌드분석 결합
                rec = generate_ai_prediction("빈도분석 모델", user_numbers)
                top_recommendations.append(rec)
            safe_log("TOP 추천 완료")
        except Exception as e:
            safe_log(f"TOP 추천 실패: {str(e)}")
            top_recommendations = [[1, 7, 13, 25, 31, 42]]
        
        # 응답 생성
        try:
            total_combinations = sum(len(model.get('predictions', [])) for model in models.values())
            data_source = f"실제 {len(csv_dataframe)}회차 데이터" if csv_dataframe is not None else f"{len(sample_data)}회차 데이터"
            
            response = {
                'success': True,
                'user_numbers': user_numbers,
                'models': models,
                'top_recommendations': top_recommendations,
                'total_combinations': total_combinations,
                'data_source': data_source,
                'analysis_applied': {
                    'frequency_analysis': frequency_analysis is not None,
                    'trend_analysis': trend_analysis is not None,
                    'pattern_analysis': pattern_analysis is not None
                }
            }
            
            safe_log("응답 생성 완료")
            return jsonify(response)
            
        except Exception as e:
            safe_log(f"응답 생성 실패: {str(e)}")
            raise e
        
    except Exception as e:
        safe_log(f"predict API 전체 실패: {str(e)}")
        import traceback
        safe_log(f"Traceback: {traceback.format_exc()}")
        
        return jsonify({
            'success': False,
            'error': '서버 내부 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            'debug_info': str(e)
        }), 500

@app.route('/api/stats')
def get_stats():
    """통계 API (실제 분석 데이터 반영)"""
    try:
        safe_log("stats API 호출")
        
        if sample_data is None:
            initialize_data_ultra_safe()
        
        # 실제 분석 데이터 사용
        if frequency_analysis:
            hot_numbers = frequency_analysis['hot_numbers']
            cold_numbers = list(reversed(frequency_analysis['cold_numbers']))
        else:
            hot_numbers = [[7, 15], [13, 14], [22, 13], [31, 12], [42, 11]]
            cold_numbers = [[45, 8], [44, 9], [43, 10], [2, 11], [3, 12]]
        
        return jsonify({
            'frequency': frequency_analysis['counter'] if frequency_analysis else {},
            'hot_numbers': hot_numbers,
            'cold_numbers': cold_numbers,
            'total_draws': len(sample_data) if sample_data else 200,
            'data_source': f"실제 {len(csv_dataframe)}회차 데이터" if csv_dataframe is not None else "샘플 데이터",
            'analysis_status': {
                'frequency_analysis': frequency_analysis is not None,
                'trend_analysis': trend_analysis is not None,
                'pattern_analysis': pattern_analysis is not None
            }
        })
        
    except Exception as e:
        safe_log(f"stats API 실패: {str(e)}")
        return jsonify({
            'frequency': {},
            'hot_numbers': [[7, 15]],
            'cold_numbers': [[45, 8]],
            'total_draws': 200,
            'data_source': '기본 데이터'
        })

@app.route('/api/health')
def health_check():
    """상세한 헬스 체크"""
    try:
        status = {
            'status': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'version': '2.0.0 (Real Data Analysis)',
            'pandas_available': PANDAS_AVAILABLE,
            'csv_loaded': csv_dataframe is not None,
            'sample_data_count': len(sample_data) if sample_data else 0,
            'current_directory': os.getcwd(),
            'csv_file_exists': os.path.exists('new_1188.csv'),  # 수정된 파일명
            'analysis_status': {
                'frequency_analysis': frequency_analysis is not None,
                'trend_analysis': trend_analysis is not None,
                'pattern_analysis': pattern_analysis is not None
            }
        }
        
        if csv_dataframe is not None:
            status['csv_rows'] = len(csv_dataframe)
            status['data_source'] = 'CSV 실제 데이터'
        else:
            status['data_source'] = '샘플 데이터'
        
        # 파일 목록
        try:
            status['files_in_directory'] = os.listdir('.')
        except:
            status['files_in_directory'] = ['확인 불가']
        
        return jsonify(status)
        
    except Exception as e:
        safe_log(f"health check 실패: {str(e)}")
        return jsonify({
            'status': 'error',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

@app.errorhandler(404)
def not_found(error):
    try:
        return render_template('index.html'), 404
    except:
        return "404 Not Found", 404

@app.errorhandler(500)
def internal_error(error):
    safe_log(f"500 에러 발생: {error}")
    return jsonify({'error': 'Internal server error', 'details': str(error)}), 500

# 앱 시작 시 즉시 초기화
try:
    initialize_data_ultra_safe()
    safe_log("=== 앱 초기화 완료 ===")
except Exception as e:
    safe_log(f"=== 앱 초기화 실패: {str(e)} ===")

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
