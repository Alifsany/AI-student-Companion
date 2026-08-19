const fs = require('fs');

function replaceRedirect(file, oldRedirect, newRedirect) {
  let c = fs.readFileSync(file, 'utf8');
  c = c.replace(oldRedirect, newRedirect);
  fs.writeFileSync(file, c);
}

replaceRedirect('src/actions/profile.ts', "redirect('/dashboard');", "redirect('/dashboard?toast=Profile+updated+successfully.');");
replaceRedirect('src/actions/subjects.ts', "redirect('/subjects');", "redirect('/subjects?toast=Subject+created+successfully.');");
// Wait, subjects.ts has update and create. Let's just modify the strings inside them.
