/**
 * cn — concatène des classes conditionnelles en ignorant les valeurs
 * falsy (false, null, undefined). Léger remplaçant de clsx, suffisant
 * pour composer les variants de nos composants UI.
 *
 * Ex : cn('px-4', isActive && 'bg-primary-600', disabled && 'opacity-50')
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}
