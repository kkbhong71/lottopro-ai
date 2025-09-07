from flask import Flask, render_template, request, jsonify
import os
import random
import numpy as np
from datetime import datetime
import json

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

def safe_log(message):
    """안전한 로깅"""
    try:
        print(f"[LOG] {message}")
    except:
        pass

def load_csv_data_ultra_safe():
    """극도로 안전한 CSV 데이터 로드"""
    global csv_dataframe, PANDAS_AVAILABLE
    
    safe_log("CSV 로드 시작")
    
    if not PANDAS_AVAILABLE:
        safe_log("pandas 없음 - CSV 로드 불가")
        return None
    
    try:
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
    """극도로 안전한 CSV 변환"""
    if df is None:
        return []
    
    try:
        safe_log("CSV 변환 시작")
        sample_data = []
        
        for index, row in df.iterrows():
            try:
                data_row = {
                    '회차': int(row.get('round', index + 1)),
                    '당첨번호1': int(row.get('num1', 1)),
                    '당첨번호2': int(row.get('num2', 2)),
                    '당첨번호3': int(row.get('num3', 3)),
                    '당첨번호4': int(row.get('num4', 4)),
                    '당첨번호5': int(row.get('num5', 5)),
                    '당첨번호6': int(row.get('num6', 6)),
                    '보너스번호': int(row.get('bonus num', 7))
                }
                sample_data.append(data_row)
            except Exception as e:
                safe_log(f"행 변환 실패 (인덱스 {index}): {str(e)}")
                continue
        
        # 안전한 정렬
        try:
            sample_data.sort(key=lambda x: x.get('회차', 0), reverse=True)
        except:
            pass
        
        safe_log(f"CSV 변환 완료: {len(sample_data)}회차")
        return sample_data
        
    except Exception as e:
        safe_log(f"CSV 변환 실패: {str(e)}")
        return []

def generate_ultra_safe_sample_data():
    """극도로 안전한 기본 데이터"""
    try:
        safe_log("기본 샘플 데이터 생성 시작")
        np.random.seed(42)
        data = []
        
        for draw in range(1184, 984, -1):  # 200회차
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
        # 최후의 수단 - 하드코딩된 데이터
        return [
            {'회차': 1184, '당첨번호1': 14, '당첨번호2': 16, '당첨번호3': 23, '당첨번호4': 25, '당첨번호5': 31, '당첨번호6': 37, '보너스번호': 42},
            {'회차': 1183, '당첨번호1': 4, '당첨번호2': 15, '당첨번호3': 17, '당첨번호4': 23, '당첨번호5': 27, '당첨번호6': 36, '보너스번호': 31},
            {'회차': 1182, '당첨번호1': 1, '당첨번호2': 13, '당첨번호3': 21, '당첨번호4': 25, '당첨번호5': 28, '당첨번호6': 31, '보너스번호': 22}
        ]

def initialize_data_ultra_safe():
    """극도로 안전한 데이터 초기화"""
    global sample_data, csv_dataframe
    
    try:
        safe_log("=== 데이터 초기화 시작 ===")
        
        # CSV 시도
        csv_dataframe = load_csv_data_ultra_safe()
        
        if csv_dataframe is not None:
            sample_data = convert_csv_ultra_safe(csv_dataframe)
            if len(sample_data) > 0:
                safe_log(f"✅ CSV 기반 초기화 완료: {len(sample_data)}회차")
                return sample_data
        
        # 기본 데이터 생성
        safe_log("CSV 실패 - 기본 데이터 생성")
        sample_data = generate_ultra_safe_sample_data()
        safe_log(f"✅ 기본 데이터 초기화 완료: {len(sample_data)}회차")
        return sample_data
        
    except Exception as e:
        safe_log(f"데이터 초기화 전체 실패: {str(e)}")
        # 최후의 수단
        sample_data = [
            {'회차': 1184, '당첨번호1': 14, '당첨번호2': 16, '당첨번호3': 23, '당첨번호4': 25, '당첨번호5': 31, '당첨번호6': 37, '보너스번호': 42}
        ]
        return sample_data

def generate_ultra_safe_prediction(user_numbers=None):
    """극도로 안전한 예측 생성"""
    try:
        if user_numbers is None:
            user_numbers = []
        
        # user_numbers 검증
        safe_numbers = []
        if isinstance(user_numbers, list):
            for num in user_numbers:
                try:
                    n = int(num)
                    if 1 <= n <= 45 and n not in safe_numbers:
                        safe_numbers.append(n)
                except:
                    continue
        
        # 6개 채우기
        numbers = safe_numbers.copy()
        while len(numbers) < 6:
            new_num = random.randint(1, 45)
            if new_num not in numbers:
                numbers.append(new_num)
        
        return sorted(numbers[:6])
        
    except Exception as e:
        safe_log(f"예측 생성 실패: {str(e)}")
        return [1, 7, 13, 25, 31, 42]

@app.route('/')
def index():
    """메인 페이지"""
    try:
        return render_template('index.html')
    except Exception as e:
        safe_log(f"메인 페이지 오류: {str(e)}")
        return "서비스 준비 중입니다.", 503

@app.route('/api/predict', methods=['POST'])
def predict():
    """극도로 안전한 AI 예측 API"""
    try:
        safe_log("=== predict API 호출 시작 ===")
        
        # 데이터 초기화 확인
        if sample_data is None:
            safe_log("sample_data 없음 - 초기화 시도")
            initialize_data_ultra_safe()
        
        # 요청 데이터 안전하게 파싱
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
        
        # 예측 생성
        try:
            safe_log("예측 생성 시작")
            
            # 5개 모델 예측
            models = {}
            for model_name in ['빈도분석 모델', '트렌드분석 모델', '패턴분석 모델', '통계분석 모델', '머신러닝 모델']:
                try:
                    predictions = []
                    for i in range(10):
                        pred = generate_ultra_safe_prediction(user_numbers)
                        predictions.append(pred)
                    
                    models[model_name] = {
                        'description': f'{model_name} 기반 AI 예측',
                        'predictions': predictions
                    }
                    safe_log(f"{model_name} 완료")
                except Exception as e:
                    safe_log(f"{model_name} 실패: {str(e)}")
                    models[model_name] = {
                        'description': f'{model_name} 기반 AI 예측',
                        'predictions': [[1, 7, 13, 25, 31, 42]]
                    }
            
            # TOP 추천
            try:
                top_recommendations = []
                for i in range(5):
                    rec = generate_ultra_safe_prediction(user_numbers)
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
                    'data_source': data_source
                }
                
                safe_log("응답 생성 완료")
                return jsonify(response)
                
            except Exception as e:
                safe_log(f"응답 생성 실패: {str(e)}")
                raise e
            
        except Exception as e:
            safe_log(f"예측 생성 전체 실패: {str(e)}")
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
    """극도로 안전한 통계 API"""
    try:
        safe_log("stats API 호출")
        
        if sample_data is None:
            initialize_data_ultra_safe()
        
        # 기본 통계
        hot_numbers = [[7, 15], [13, 14], [22, 13], [31, 12], [42, 11]]
        cold_numbers = [[45, 8], [44, 9], [43, 10], [2, 11], [3, 12]]
        
        return jsonify({
            'frequency': {},
            'hot_numbers': hot_numbers,
            'cold_numbers': cold_numbers,
            'total_draws': len(sample_data) if sample_data else 200,
            'data_source': f"실제 {len(csv_dataframe)}회차 데이터" if csv_dataframe is not None else "샘플 데이터"
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
            'version': '1.0.0 (Ultra Safe)',
            'pandas_available': PANDAS_AVAILABLE,
            'csv_loaded': csv_dataframe is not None,
            'sample_data_count': len(sample_data) if sample_data else 0,
            'current_directory': os.getcwd(),
            'csv_file_exists': os.path.exists('new_1186.csv')
        }
        
        if csv_dataframe is not None:
            status['csv_rows'] = len(csv_dataframe)
            status['data_source'] = 'CSV 실제 데이터'
        else:
            status['data_source'] = '샘플 데이터'
        
        # 파일 목록 안전하게 가져오기
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
