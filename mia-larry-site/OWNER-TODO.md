# Owner checklist

Items below need your input or confirmation. Nothing on the site has been checked against your real records, so please read this before announcing the site.

## 1. Turn on the inquiry form (required)
Add the email-service variables described in `README.md` ("Make the inquiry form deliver email"). Then send yourself a test inquiry from the live site and confirm it arrives (check spam the first time). **This has not been verified against a real email service**, only against a simulated one in automated tests.

Also **delete the old Web3Forms key from your Web3Forms dashboard and create a new one**: the previous version of the site contained it in public page source.

## 2. Confirm every puppy fact in `data/puppies.json`
Only these facts came from you: names, the ages of Mell (8 weeks), Bale (7.5), Beili (7) and Xian (7.5), and the sex of Bale, Beili and Xian. Everything else needs checking:
- **Sex** is blank for Mell, Bery, Max, Luna, Kade and Bell. Add it, or leave it hidden.
- **Age** is blank for Bery, Max, Luna, Kade and Bell. Ages are static text, so update them (or remove them) as the puppies grow.
- **Color and appearance** were written from the photos only.
- **Prices** are the amounts currently shown; they were suggested during editing, not taken from your records. Confirm or change each one.
- **Status:** every puppy is marked Available. Change to Reserved or Sold when that changes.
- **Breed:** every listing says Maltipoo. No Chihuahua puppies are listed yet, so add them when you have them.
- **Age at transfer:** Bale, Beili and Xian are listed under 8 weeks. Federal rules prohibit shipping puppies younger than 8 weeks, and many states set 8 weeks as the minimum age for sale. Check your state's rules and make sure no puppy leaves early.

## 3. Claims on the site that must be true
These come from your Policies text and are repeated in the hero, the highlights bar, "About" and the FAQ. Keep them only if you do all of them for every puppy: veterinary examination before transfer; vaccination and deworming records and a veterinary health report; a written health guarantee; live video calls; nationwide delivery and local pickup; ongoing support after pickup.

Removed because nothing supported them: the 10-year health guarantee, "never from a puppy mill", the "free delivery" banner, "online now / replies within a few hours", "puppies are reserved within days", and per-puppy birth dates, weights, parents, listing IDs and personality descriptions. Add any of these back only with real information.

## 4. Business details still missing
- City and state (or service area), full legal names, and a business name if registered.
- Any breeder, kennel or USDA license your state or the way you sell requires.
- Name of the veterinary clinic that examines your puppies (buyers often ask).
- A privacy statement for the details collected by the form.
- A custom domain with a matching email address (for example `hello@yourdomain.com`) instead of Gmail.

## 5. Photos and reviews
- Confirm you own, or have permission to use, every photo, including the family photo and the customer photos.
- The five reviews and their photos are included as you supplied them, with only the state as credit. Keep written permission from each customer. Adding a first name and a link to where the review was posted makes them more believable.
- Do not add or edit review text.

## 6. Legal
Have a lawyer read the Policies (including the California governing-law clause) and the separate Puppy Sales Agreement before taking deposits. Payments are handled outside the site; no payment, booking or account features were added.

## 7. Your own words
The "About Mia & Larry" section only states what your Policies already say. Add your real story (how you started, where you live, how many dogs you keep) in `index.html` when you are ready.
