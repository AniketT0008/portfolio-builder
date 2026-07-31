-- ============================================================================
-- Premium generation types + career tools support
-- ============================================================================

alter table public.generations drop constraint if exists generations_type_check;

alter table public.generations add constraint generations_type_check
  check (type in (
    'resume_bullets', 'star_response', 'portfolio_page', 'readme',
    'linkedin_post', 'presentation', 'tech_docs', 'cover_letter',
    'scholarship_app', 'architecture_overview',
    'skills_extraction', 'impact_score', 'interview_questions',
    'recruiter_review', 'achievement_quantifier', 'hackathon_submission',
    'college_activity', 'project_timeline'
  ));
