# frozen_string_literal: true

class HostBlueprint < Blueprinter::Base
  identifier :id

  fields :email, :active

  field :team_id do |host|
    host.primary_team&.id
  end

  field :team_name do |host|
    host.primary_team&.name
  end
end
