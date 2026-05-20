export type Achievement = {
  id: string;
  name: string;
  description: string;
  emoji: string;
  category: 'volumen' | 'rachas' | 'mascotas' | 'cocina' | 'limpieza' | 'horarios' | 'variedad' | 'especiales';
};

export const ACHIEVEMENTS: Achievement[] = [
  // VOLUMEN
  { id: 'vol_1', name: 'Primera Tarea', description: 'Completaste tu primera tarea. ¡El viaje comienza!', emoji: '🌱', category: 'volumen' },
  { id: 'vol_10', name: 'Principiante', description: 'Completaste 10 tareas.', emoji: '🥉', category: 'volumen' },
  { id: 'vol_50', name: 'Aprendiz', description: 'Llegaste a las 50 tareas completadas.', emoji: '🥈', category: 'volumen' },
  { id: 'vol_100', name: 'Constante', description: 'Alcanzaste las 100 tareas. ¡Impresionante!', emoji: '🥇', category: 'volumen' },
  { id: 'vol_250', name: 'Confiable', description: '250 tareas completadas. Todos pueden contar contigo.', emoji: '💎', category: 'volumen' },
  { id: 'vol_500', name: 'Veterano', description: 'Medio millar de tareas. Eres una máquina.', emoji: '🔥', category: 'volumen' },
  { id: 'vol_1000', name: 'Maestro del Hogar', description: '1000 tareas. Te deberían hacer una estatua.', emoji: '🏛️', category: 'volumen' },
  { id: 'vol_2500', name: 'Pilar de la Familia', description: '2500 tareas. Sostienes el hogar entero.', emoji: '🌍', category: 'volumen' },

  // RACHAS
  { id: 'streak_3', name: 'Calentando Motores', description: 'Completaste tareas 3 días seguidos.', emoji: '🔥', category: 'rachas' },
  { id: 'streak_7', name: 'Semana Perfecta', description: 'Completaste tareas durante 7 días seguidos.', emoji: '✨', category: 'rachas' },
  { id: 'streak_14', name: 'Imparable', description: 'Racha de 14 días. ¡Nada te detiene!', emoji: '🚀', category: 'rachas' },
  { id: 'streak_30', name: 'Mes de Disciplina', description: '30 días seguidos haciendo tareas.', emoji: '📅', category: 'rachas' },
  { id: 'streak_50', name: 'Medio Centenar', description: '50 días de racha activa.', emoji: '💯', category: 'rachas' },
  { id: 'streak_100', name: 'Hábito de Acero', description: '100 días seguidos. Es parte de tu ADN.', emoji: '🦾', category: 'rachas' },

  // MASCOTAS
  { id: 'pet_1', name: 'Primer Bocado', description: 'Alimentaste a una mascota por primera vez.', emoji: '🦴', category: 'mascotas' },
  { id: 'pet_10', name: 'Cuidador Novato', description: '10 turnos de alimentación.', emoji: '🐾', category: 'mascotas' },
  { id: 'pet_50', name: 'Amigo Fiel', description: '50 turnos de alimentación. Te adoran.', emoji: '🐕', category: 'mascotas' },
  { id: 'pet_100', name: 'Mejor Amigo del Hombre', description: '100 turnos de alimentación.', emoji: '❤️', category: 'mascotas' },
  { id: 'pet_250', name: 'Whisperer de Mascotas', description: '250 turnos. Eres su persona favorita.', emoji: '👑', category: 'mascotas' },

  // COCINA
  { id: 'cook_1', name: 'Chef de Microondas', description: 'Tu primera tarea en la cocina.', emoji: '🍳', category: 'cocina' },
  { id: 'cook_10', name: 'Pinche de Cocina', description: '10 tareas relacionadas a la cocina.', emoji: '🧑‍🍳', category: 'cocina' },
  { id: 'cook_50', name: 'Cocinero de la Casa', description: '50 tareas de cocina.', emoji: '🍲', category: 'cocina' },
  { id: 'cook_100', name: 'Masterchef Familiar', description: '100 tareas de cocina. ¡Delicioso!', emoji: '👨‍🍳', category: 'cocina' },

  // LIMPIEZA
  { id: 'clean_1', name: 'Primer Escobazo', description: 'Tu primera tarea de limpieza.', emoji: '🧹', category: 'limpieza' },
  { id: 'clean_10', name: 'Amante del Orden', description: '10 tareas de limpieza.', emoji: '🧼', category: 'limpieza' },
  { id: 'clean_50', name: 'Tornado de la Limpieza', description: '50 tareas de limpieza.', emoji: '🌪️', category: 'limpieza' },
  { id: 'clean_100', name: 'Don Limpio', description: '100 tareas de limpieza. Todo brilla.', emoji: '✨', category: 'limpieza' },

  // HORARIOS
  { id: 'time_owl', name: 'Búho Nocturno', description: 'Registraste 10 tareas después de las 22:00.', emoji: '🦉', category: 'horarios' },
  { id: 'time_vampire', name: 'Vampiro', description: 'Registraste 50 tareas después de las 22:00.', emoji: '🦇', category: 'horarios' },
  { id: 'time_early', name: 'Madrugador', description: 'Registraste 10 tareas antes de las 08:00 AM.', emoji: '🌅', category: 'horarios' },
  { id: 'time_rooster', name: 'El Gallo', description: 'Registraste 50 tareas antes de las 08:00 AM.', emoji: '🐓', category: 'horarios' },
  { id: 'time_witch', name: 'Hora de las Brujas', description: 'Completaste una tarea entre las 03:00 y las 04:00 AM.', emoji: '👻', category: 'horarios' },

  // DÍAS
  { id: 'day_monday', name: 'Lunes Productivo', description: 'Hiciste 10 tareas en día Lunes.', emoji: '📈', category: 'variedad' },
  { id: 'day_monday_pro', name: 'Odiador de Lunes', description: 'Hiciste 50 tareas en Lunes para que pasen rápido.', emoji: '👔', category: 'variedad' },
  { id: 'day_weekend', name: 'Héroe de Fin de Semana', description: '10 tareas en fin de semana (Sábado o Domingo).', emoji: '🦸', category: 'variedad' },

  // VARIEDAD & ESPECIALES
  { id: 'var_5', name: 'Navaja Suiza', description: 'Has hecho 5 tipos diferentes de tareas.', emoji: '🔪', category: 'variedad' },
  { id: 'var_10', name: 'Multitasking', description: 'Has hecho 10 tipos diferentes de tareas.', emoji: '🤹', category: 'variedad' },
  { id: 'var_20', name: 'Hombre/Mujer Orquesta', description: 'Has hecho 20 tipos diferentes de tareas.', emoji: '🎺', category: 'variedad' },
  
  { id: 'spec_trash_50', name: 'Rey de la Basura', description: 'Sacaste la basura 50 veces.', emoji: '🗑️', category: 'especiales' },
  { id: 'spec_clothes_50', name: 'Lavandero', description: 'Lavaste ropa 50 veces.', emoji: '👕', category: 'especiales' },
  { id: 'spec_bathroom_20', name: 'La Ingrata', description: 'Limpiaste o hiciste el baño 20 veces.', emoji: '🚽', category: 'especiales' },
  { id: 'spec_repair_10', name: 'Bob el Constructor', description: 'Reparaste cosas de la casa 10 veces.', emoji: '🔨', category: 'especiales' },
  { id: 'spec_plants_20', name: 'Druida', description: 'Regaste las plantas 20 veces.', emoji: '🪴', category: 'especiales' },
];
