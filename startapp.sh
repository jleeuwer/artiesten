mkdir -p logs
npm run install:all 2>&1 | tee "logs/npm-install-all-$(date +%Y%m%d-%H%M%S).log" 
npm run build 2>&1 | tee "logs/npm-build-all-$(date +%Y%m%d-%H%M%S).log"
npm run test:all 2>&1 | tee "logs/test-e2e-$(date +%Y%m%d-%H%M%S).log"
npm run dev 2>&1 | tee "logs/dev-$(date +%Y%m%d-%H%M%S).log"