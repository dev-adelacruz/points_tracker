# frozen_string_literal: true

company = Company.find_or_create_by!(name: "Default Company")
puts "Seeded company: #{company.name} (id=#{company.id})"

# Managers (admin role)
manager_names = %w[Gie Rex]
manager_names.each do |name|
  User.find_or_create_by!(email: "#{name.downcase}@example.com") do |u|
    u.name = name
    u.password = "password123"
    u.role = :admin
    u.company = company
  end
end
puts "Seeded #{manager_names.size} managers"

# Emcees (20) — each gets their own team of 5 hosts
emcee_names = %w[Ace Blaze Cleo Dash Echo Finn Glow Haze Iris Jet
                 Koda Lux Miko Nyx Onyx Pax Quinn Rio Sage Dam]

# hosts per emcee team (index matches emcee_names)
host_names = [
  %w[Brio Cruz Dex Fable Ghost],
  %w[Halo Ink Jive Knox Lyra],
  %w[Mars Neo Opal Pike Quill],
  %w[Rune Skye Tint Ursa Vex],
  %w[Wren Xero Yuki Zane Arco],
  %w[Bolt Chip Drew Edge Flux],
  %w[Grit Helm Ivan Jade Kale],
  %w[Lace Mace Nemo Odin Pyre],
  %w[Reef Silo Tuck Undo Veil],
  %w[Wade Xan Yule Zed Aura],
  %w[Bard Cain Dusk Ember Frost],
  %w[Gust Hawk Idle Jinx Kite],
  %w[Lore Myth Nova Oath Pike2],
  %w[Rave Scar Tide Ural Void],
  %w[Wisp Xis Yew Zinc Ash],
  %w[Blip Curl Dune Envy Floe],
  %w[Gale Husk Ire Jolt Knot],
  %w[Lash Mire Nimb Orb Plum],
  %w[Rook Span Tern Umber Vale],
  %w[Nami Cindy Viv Irah Mawi Rhona]
]

team_names = emcee_names.map { |n| "#{n}'s Crew" }
team_names[19] = "Code Red"

emcee_names.each_with_index do |emcee_name, i|
  emcee = User.find_or_create_by!(email: "#{emcee_name.downcase}@example.com") do |u|
    u.name = emcee_name
    u.password = "password123"
    u.role = :emcee
    u.company = company
  end

  team = Team.find_or_create_by!(name: team_names[i]) do |t|
    t.company = company
  end

  TeamEmceeAssignment.find_or_create_by!(team: team, user: emcee) do |a|
    a.active = true
  end

  host_names[i].each do |host_name|
    host = User.find_or_create_by!(email: "#{host_name.downcase}@example.com") do |u|
      u.name = host_name
      u.password = "password123"
      u.role = :host
      u.company = company
    end
    TeamMembership.find_or_create_by!(team: team, user: host)
  end
end

puts "Seeded #{emcee_names.size} emcees, #{emcee_names.size} teams, #{emcee_names.size * 5} hosts"
