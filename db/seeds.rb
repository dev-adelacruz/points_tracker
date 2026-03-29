# frozen_string_literal: true

# Default company — single-tenant setup
company = Company.find_or_create_by!(name: "Default Company")

# Backfill company_id for any existing records (safe to re-run)
Team.where(company_id: nil).update_all(company_id: company.id)
User.where(company_id: nil).update_all(company_id: company.id)
Session.where(company_id: nil).update_all(company_id: company.id)
CoinEntry.where(company_id: nil).update_all(company_id: company.id)

puts "Seeded company: #{company.name} (id=#{company.id})"

# Backfill names for existing users that don't have one
User.where(name: "").find_each do |user|
  local_part = user.email.split("@").first
  generated_name = local_part.gsub(/[._\-+]/, " ").split.map(&:capitalize).join(" ")
  user.update_columns(name: generated_name)
end

puts "Backfilled names for users with blank name"
