-- Migration one-shot : hasher les PIN en clair restants (colonne legacy pin)

UPDATE actors
SET pin_hash = crypt(pin, gen_salt('bf', 10)),
    pin = NULL
WHERE pin IS NOT NULL
  AND trim(pin) <> ''
  AND (pin_hash IS NULL OR pin_hash = '');
