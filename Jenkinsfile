pipeline {
    agent any

    stages {
        // 1. 환경 변수(.env) 주입
        stage('Env Setup') {
            steps {
                dir('backend') {
                    echo '==> [1/5] .env 파일 주입 중...'
                    withCredentials([file(credentialsId: 'gachi-gacha-env', variable: 'ENV_FILE')]) {
                        sh 'cp $ENV_FILE .env'
                    }
                }
            }
        }

        // 2. 의존성 다운로드 및 소스코드 컴파일
        stage('Compile & Dependencies') {
            steps {
                dir('backend') {
                    echo '==> [2/5] 프로젝트 의존성 다운로드 및 소스코드 컴파일'
                    sh './gradlew compileJava --no-daemon'
                }
            }
        }

        // 3. 단위 및 통합 테스트 실행
        stage('Test') {
            steps {
                dir('backend') {
                    echo '==> [3/5] 단위 및 통합 테스트 실행'
                    sh './gradlew test --no-daemon'
                }
            }
            post {
                always {
                    junit allowEmptyResults: true, testResults: '**/backend/build/test-results/test/*.xml'
                }
            }
        }

        // 4. Executable Fat JAR 파일 빌드
        stage('Build Artifact') {
            steps {
                dir('backend') {
                    echo '==> [4/5] Spring Boot Executable JAR 파일 빌드'
                    sh './gradlew bootJar -x test --no-daemon'
                }
            }
        }

        // 5. 서버 프로세스 재시작 및 배포
        stage('Deploy') {
            when {
                branch 'backend-dev' // main 브랜치일 때만 배포 실행
            }
            steps {
                dir('backend') {
                    echo '==> [5/5] 애플리케이션 프로세스 종료 및 재배포'
                    sh '''
                        APP_PORT=8081
                        CURRENT_PID=$(lsof -t -i:${APP_PORT} || true)

                        if [ -n "$CURRENT_PID" ]; then
                            echo "==> ${APP_PORT} 포트 점유 중인 기존 프로세스 종료 (PID: $CURRENT_PID)..."
                            kill -15 $CURRENT_PID
                            sleep 5
                        fi

                        JAR_PATH=$(ls build/libs/*.jar | grep -v 'plain' | head -n 1)
                        echo "==> 실행할 JAR 파일: $JAR_PATH"

                        nohup java -jar $JAR_PATH > app.log 2>&1 &
                        echo "==> 배포 프로세스 백그라운드 실행 완료!"
                    '''
                }
            }
        }
    }
}
