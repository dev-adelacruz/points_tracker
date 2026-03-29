# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Team Totals Report" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team) { create(:team) }
  let(:start_date) { "2026-01-01" }
  let(:end_date) { "2026-01-31" }

  describe "#show" do
    path "/api/v1/reports/team_totals" do
      get "returns coin totals aggregated by team" do
        tags "Reports"
        produces "application/json"

        parameter name: :start_date, in: :query, type: :string, required: true
        parameter name: :end_date,   in: :query, type: :string, required: true

        response(200, "returns team totals for admin") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before do
            create(:team_membership, team: team, user: host)
            session = create(:session, date: "2026-01-15", team: team)
            session.session_hosts.create!(user: host)
            create(:coin_entry, user: host, session: session, coins: 200)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            row = json_response[:data].find { |r| r[:team_id] == team.id }
            expect(row[:total_coins]).to eq(200)
            expect(row[:host_count]).to eq(1)
            expect(row[:avg_coins_per_host]).to eq(200.0)
          end
        end

        response(200, "emcee sees only their assigned teams") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }
          let(:other_team) { create(:team) }

          before do
            create(:team_emcee_assignment, team: team, user: emcee)
            other_team
            sign_in emcee
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            ids = json_response[:data].map { |r| r[:team_id] }
            expect(ids).to include(team.id)
            expect(ids).not_to include(other_team.id)
          end
        end

        response(200, "returns zero coins for a team with no entries in the period") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before do
            team
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            row = json_response[:data].find { |r| r[:team_id] == team.id }
            expect(row[:total_coins]).to eq(0)
            expect(row[:avg_coins_per_host]).to eq(0.0)
          end
        end

        response(422, "returns error when date params are missing") do
          let(:start_date) { nil }
          let(:end_date)   { nil }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status(:unprocessable_content)
          end
        end

        response(403, "forbids host role") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before { sign_in host }

          run_test! do
            expect(response).to have_http_status(:forbidden)
          end
        end
      end
    end
  end
end
