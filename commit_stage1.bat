@echo off
cd /d "D:\Trae\auto-coding-agent-demo-main\hello-nextjs"
git add .
git commit -m "Stage 1: Project Management Interface Refactor

- Add new stage system with 5 phases: planning, story, storyboard, production, complete
- Add StageProgress type and stage management methods
- Create StageNavigator component with visual progress bar
- Create 5 stage pages: planning, story, storyboard, production, complete
- Add stage management API route
- Implement non-linear workflow with stage locking/unlocking
- Project planning page with logline, synopsis, genre, duration forms
- Stage completion tracking and progress percentage"
git push origin main
pause
