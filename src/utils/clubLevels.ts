import { LevelPrerequisites } from '../types/index.ts';

/**
 * Calculates official prerequisites and rewards for any level between 0 and 80.
 * Level 0 is the starting default.
 * Level 80 is the legendary milestone that unlocks the Estadio Monumental.
 */
export function getLevelPrerequisites(level: number): LevelPrerequisites {
  const lvl = Math.max(0, Math.min(80, Math.floor(level)));

  if (lvl === 0) {
    return {
      level: 0,
      title: 'Club Amateur / Fundación',
      xp_required: 0,
      reputation_required: 1000,
      matches_won_required: 0,
      fans_required: 0,
      is_monumental_eligible: false,
      reward_coins: 0
    };
  }

  // Progressive XP curve (from 100 XP at lvl 1 to 80,000 XP at lvl 80)
  const xp_required = Math.round(15 * Math.pow(lvl, 1.95));

  // Reputation curve (1,000 base + 80 per level up to 7,400)
  const reputation_required = 1000 + Math.round(lvl * 80);

  // Matches won required (0.95 wins per level up to ~76 wins)
  const matches_won_required = Math.max(1, Math.round(lvl * 0.95));

  // Fans required
  const fans_required = Math.round(200 * Math.pow(lvl, 1.8));

  // Reward coins on reaching this level
  const reward_coins = Math.round(10000 + lvl * 60000);

  // Level titles by tier
  let title = 'Club Regional';
  if (lvl >= 80) title = 'Leyenda Monumental Absoluta';
  else if (lvl >= 70) title = 'Coloso del Fútbol Continental';
  else if (lvl >= 60) title = 'Potencia de Primera División';
  else if (lvl >= 50) title = 'Club Élite Nacional';
  else if (lvl >= 40) title = 'Institución Profesional Consolidada';
  else if (lvl >= 30) title = 'Aspirante de Oro';
  else if (lvl >= 20) title = 'Club en Ascenso Firme';
  else if (lvl >= 10) title = 'Club Profesional Emergente';

  return {
    level: lvl,
    title,
    xp_required,
    reputation_required,
    matches_won_required,
    fans_required,
    is_monumental_eligible: lvl >= 80,
    reward_coins
  };
}

/**
 * Checks if a club satisfies all prerequisites to advance to targetLevel.
 */
export function canAdvanceToLevel(club: {
  level?: number;
  xp?: number;
  reputation?: number;
  matches_won?: number;
  fans?: number;
}, targetLevel: number): {
  canAdvance: boolean;
  missing: string[];
  prereqs: LevelPrerequisites;
} {
  const prereqs = getLevelPrerequisites(targetLevel);
  const currentXp = club.xp || 0;
  const currentRep = club.reputation || 1000;
  const currentWins = club.matches_won || 0;
  const currentFans = club.fans || 0;

  const missing: string[] = [];

  if (currentXp < prereqs.xp_required) {
    missing.push(`Experiencia: ${currentXp.toLocaleString()} / ${prereqs.xp_required.toLocaleString()} XP`);
  }
  if (currentRep < prereqs.reputation_required) {
    missing.push(`Reputación: ${currentRep} / ${prereqs.reputation_required} pts`);
  }
  if (currentWins < prereqs.matches_won_required) {
    missing.push(`Victorias Oficiales: ${currentWins} / ${prereqs.matches_won_required} victorias`);
  }
  if (currentFans < prereqs.fans_required) {
    missing.push(`Afición: ${currentFans.toLocaleString()} / ${prereqs.fans_required.toLocaleString()} fans`);
  }

  return {
    canAdvance: missing.length === 0,
    missing,
    prereqs
  };
}
