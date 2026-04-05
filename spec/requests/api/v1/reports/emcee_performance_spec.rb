# frozen_string_literal: true

require "swagger_helper"

RSpec.describe "Emcee Performance Report" do
  let(:json_response) { JSON.parse(response.body, symbolize_names: true) }
  let(:admin) { create(:user, :admin) }
  let(:emcee) { create(:user, :emcee) }
  let(:emcee2) { create(:user, :emcee) }
  let(:host) { create(:user, :host) }
  let(:team) { create(:team) }

  describe "#show" do
    path "/api/v1/reports/emcee_performance" do
      get "returns emcee activity report for the given date range" do
        tags "Reports"
        produces "application/json"

        parameter name: :start_date, in: :query, type: :string, required: true
        parameter name: :end_date,   in: :query, type: :string, required: true

        response(200, "returns emcee rows with session and coin completion stats") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before do
            create(:team_emcee_assignment, user: emcee, team: team)
            team.team_memberships.create!(user: host)
            session_with_coins = create(:session, team: team, date: "2026-01-10", created_by: emcee)
            session_without    = create(:session, team: team, date: "2026-01-20", session_slot: :slot_two, created_by: emcee)
            session_with_coins.session_hosts.create!(user: host)
            create(:coin_entry, session: session_with_coins, user: host, coins: 5_000)
            session_without
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            rows = json_response[:data]
            emcee_row = rows.find { |r| r[:emcee_id] == emcee.id }
            expect(emcee_row[:sessions_logged]).to eq(2)
            expect(emcee_row[:sessions_with_coins]).to eq(1)
            expect(emcee_row[:completion_pct]).to eq(50.0)
            expect(emcee_row[:assigned_team_names]).to include(team.name)
          end
        end

        response(200, "returns 0% completion for emcee with no coin entries") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before do
            create(:team_emcee_assignment, user: emcee, team: team)
            create(:session, team: team, date: "2026-01-10", created_by: emcee)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            emcee_row = json_response[:data].find { |r| r[:emcee_id] == emcee.id }
            expect(emcee_row[:sessions_logged]).to eq(1)
            expect(emcee_row[:sessions_with_coins]).to eq(0)
            expect(emcee_row[:completion_pct]).to eq(0.0)
          end
        end

        response(200, "returns 0 sessions for emcee with no assigned team") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before do
            emcee2
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            emcee_row = json_response[:data].find { |r| r[:emcee_id] == emcee2.id }
            expect(emcee_row[:sessions_logged]).to eq(0)
            expect(emcee_row[:completion_pct]).to eq(0.0)
          end
        end

        response(200, "excludes sessions outside the date range") do
          let(:start_date) { "2026-02-01" }
          let(:end_date)   { "2026-02-28" }

          before do
            create(:team_emcee_assignment, user: emcee, team: team)
            create(:session, team: team, date: "2026-01-15", created_by: emcee)
            sign_in admin
          end

          run_test! do
            expect(response).to have_http_status(:ok)
            emcee_row = json_response[:data].find { |r| r[:emcee_id] == emcee.id }
            expect(emcee_row[:sessions_logged]).to eq(0)
          end
        end

        response(403, "forbids non-admin roles") do
          let(:start_date) { "2026-01-01" }
          let(:end_date)   { "2026-01-31" }

          before { sign_in emcee }

          run_test! do
            expect(response).to have_http_status(:forbidden)
          end
        end

        response(422, "returns error when params are missing") do
          let(:start_date) { nil }
          let(:end_date)   { nil }

          before { sign_in admin }

          run_test! do
            expect(response).to have_http_status(:unprocessable_content)
          end
        end
      end
    end
  end
end
