/* 레벨업 길드 설정 — 배포 시 여기만 바꾼다.
   askEndpoint: "길드 마스터에게 묻기" 서버(Cloudflare Worker) 주소. 끝에 /ask 는 붙이지 않는다. 빈 문자열이면 안내만 보인다. */
window.GUILD_CONFIG = { askEndpoint: '' };
