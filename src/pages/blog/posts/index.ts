import IBlogPost from '../types/IBlogPost';
import Post1 from './1';
import Post2 from './2';

const posts: IBlogPost[] = [
  {
    id: 1,
    title: 'A Framework for Thinking About AI\'s Role in Modern Computing',
    summary: 'An evidence-first methodology for deciding between deterministic software and AI systems, converting claims into testable hypotheses tied to 2020–2025 research.',
    date: '2025-01-15',
    component: Post1,
  },
  {
    id: 2,
    title: '5 Things About AI That Might Surprise You',
    summary: 'Five surprising, sourced facts about AI\'s cost, unpredictability, failure rate, and infrastructure — and why its biggest "flaw" is actually its superpower.',
    date: '2026-09-05',
    component: Post2,
  },
];

export default posts;
