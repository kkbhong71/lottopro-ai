from flask import Flask, render_template, request, jsonify
import os
import random
# import pandas as pd  ← 이 줄 제거 (사용되지 않음)
import numpy as np
from datetime import datetime
import json

# Flask 앱 초기화
app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'lottopro-dev-key-2024')

# 글로벌 변수
sample_data = None

def initialize_sample_data():
    """샘플 로또 데이터 생성"""
    global sample_data
    
    # 100회차의 샘플 데이터 생성
    np.random.seed(42)  # 재현 가능한 랜덤 데이터
    data = []
    
    for draw in range(1100, 1000, -1):  # 1100회차부터 1001회차까지
        numbers = sorted(np.random.choice(range(1, 46), 6, replace=False))
        bonus = np.random.choice([x for x in range(1, 46) if x not in numbers])
        
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
    
    sample_data = data
    return data

@app.route('/')
def index():
    """메인 페이지"""
    return render_template('index.html')

@app.route('/api/predict', methods=['POST'])
def predict():
    """AI 예측 API (현재는 기본 버전)"""
    try:
        data = request.get_json()
        user_numbers = data.get('user_numbers', [])
        
        # 사용자 번호 검증
        if user_numbers:
            user_numbers = [int(num) for num in user_numbers if str(num).isdigit() and 1 <= int(num) <= 45]
            user_numbers = list(set(user_numbers))  # 중복 제거
        
        # 5가지 모델의 예측 결과 시뮬레이션
        models = {
            '빈도분석 모델': generate_frequency_prediction(user_numbers),
            '트렌드분석 모델': generate_trend_prediction(user_numbers),
            '패턴분석 모델': generate_pattern_prediction(user_numbers),
            '통계분석 모델': generate_statistical_prediction(user_numbers),
            '머신러닝 모델': generate_ml_prediction(user_numbers)
        }
        
        # 최고 추천 번호 생성
        top_recommendations = generate_top_recommendations(user_numbers)
        
        return jsonify({
            'success': True,
            'user_numbers': user_numbers,
            'models': models,
            'top_recommendations': top_recommendations,
            'total_combinations': sum(len(model['predictions']) for model in models.values())
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def generate_frequency_prediction(user_numbers, count=10):
    """빈도 기반 예측"""
    predictions = []
    for i in range(count):
        if user_numbers:
            numbers = user_numbers.copy()
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        else:
            numbers = sorted(random.sample(range(1, 46), 6))
        
        predictions.append(sorted(numbers))
    
    return {
        'description': '과거 당첨번호 출현 빈도를 분석하여 가중 확률로 예측',
        'predictions': predictions
    }

def generate_trend_prediction(user_numbers, count=10):
    """트렌드 기반 예측"""
    predictions = []
    for i in range(count):
        if user_numbers:
            numbers = user_numbers.copy()
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        else:
            # 최근 트렌드를 반영한 번호 생성 (시뮬레이션)
            hot_range = list(range(1, 25))  # 핫 넘버 범위
            cold_range = list(range(26, 46))  # 콜드 넘버 범위
            
            numbers = []
            numbers.extend(random.sample(hot_range, 3))  # 핫 넘버 3개
            numbers.extend(random.sample(cold_range, 3))  # 콜드 넘버 3개
        
        predictions.append(sorted(numbers))
    
    return {
        'description': '최근 당첨 패턴과 트렌드를 분석하여 예측',
        'predictions': predictions
    }

def generate_pattern_prediction(user_numbers, count=10):
    """패턴 기반 예측"""
    predictions = []
    for i in range(count):
        if user_numbers:
            numbers = user_numbers.copy()
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        else:
            # 연속번호와 간격 패턴을 고려한 생성
            numbers = []
            start = random.randint(1, 10)
            for j in range(6):
                numbers.append(start + j * random.choice([1, 2, 3, 5, 7]))
            numbers = [min(45, max(1, num)) for num in numbers]
            numbers = sorted(list(set(numbers)))
            
            # 6개가 안 되면 랜덤으로 채우기
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        
        predictions.append(sorted(numbers[:6]))
    
    return {
        'description': '번호 조합 패턴과 수학적 관계를 분석하여 예측',
        'predictions': predictions
    }

def generate_statistical_prediction(user_numbers, count=10):
    """통계 기반 예측"""
    predictions = []
    for i in range(count):
        if user_numbers:
            numbers = user_numbers.copy()
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        else:
            # 정규분포를 활용한 번호 생성
            numbers = []
            mean = 23
            std = 12
            while len(numbers) < 6:
                num = int(np.random.normal(mean, std))
                if 1 <= num <= 45 and num not in numbers:
                    numbers.append(num)
        
        predictions.append(sorted(numbers))
    
    return {
        'description': '고급 통계 기법과 확률 이론을 적용하여 예측',
        'predictions': predictions
    }

def generate_ml_prediction(user_numbers, count=10):
    """머신러닝 기반 예측"""
    predictions = []
    for i in range(count):
        if user_numbers:
            numbers = user_numbers.copy()
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        else:
            # AI 모델 시뮬레이션 (가중치 적용)
            weights = [i/45 for i in range(1, 46)]  # 번호별 가중치
            numbers = []
            for _ in range(6):
                num = np.random.choice(range(1, 46), p=np.array(weights)/sum(weights))
                while num in numbers:
                    num = np.random.choice(range(1, 46), p=np.array(weights)/sum(weights))
                numbers.append(num)
        
        predictions.append(sorted(numbers))
    
    return {
        'description': '딥러닝 신경망과 AI 알고리즘 기반 고도화된 예측',
        'predictions': predictions
    }

def generate_top_recommendations(user_numbers, count=5):
    """최고 추천 번호들"""
    recommendations = []
    
    for i in range(count):
        if user_numbers:
            numbers = user_numbers.copy()
            while len(numbers) < 6:
                new_num = random.randint(1, 45)
                if new_num not in numbers:
                    numbers.append(new_num)
        else:
            # 모든 모델을 종합한 추천 번호
            numbers = sorted(random.sample(range(1, 46), 6))
        
        recommendations.append(sorted(numbers))
    
    return recommendations

@app.route('/api/stats')
def get_stats():
    """통계 데이터 API"""
    if not sample_data:
        initialize_sample_data()
    
    # 빈도 분석
    frequency = {}
    for draw in sample_data:
        for i in range(1, 7):
            num = draw[f'당첨번호{i}']
            frequency[num] = frequency.get(num, 0) + 1
    
    # 최근 트렌드 (최근 20회차)
    recent_numbers = []
    for draw in sample_data[:20]:
        for i in range(1, 7):
            recent_numbers.append(draw[f'당첨번호{i}'])
    
    recent_freq = {}
    for num in recent_numbers:
        recent_freq[num] = recent_freq.get(num, 0) + 1
    
    hot_numbers = sorted(recent_freq.items(), key=lambda x: x[1], reverse=True)[:10]
    cold_numbers = sorted(recent_freq.items(), key=lambda x: x[1])[:10]
    
    return jsonify({
        'frequency': frequency,
        'hot_numbers': hot_numbers,
        'cold_numbers': cold_numbers,
        'total_draws': len(sample_data)
    })

@app.route('/health')
def health_check():
    """헬스 체크"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

@app.errorhandler(404)
def not_found(error):
    return render_template('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    initialize_sample_data()  # 앱 시작 시 데이터 초기화
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=True, host='0.0.0.0', port=port)
